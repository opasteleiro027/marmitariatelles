import type postgres from "postgres";
import {
  OrderRequestError,
  type ConfirmOrderRequest,
} from "../domain/order-request";

export type OrderProductRow = {
  product_id: string;
  name: string;
  price_cents: number;
  promotional_price_cents: number | null;
  stock_quantity: number | null;
  order_limit: number | null;
  product_active: boolean;
  sold_out: boolean;
};

export type PricedOrderLine = OrderProductRow & {
  quantity: number;
  notes: string | null;
  unitPriceInCents: number;
  addonTotalInCents: number;
  addons: Array<{
    optionId: string;
    groupName: string;
    name: string;
    unitPriceInCents: number;
    quantity: number;
  }>;
};

type GroupLinkRow = {
  product_id: string;
  group_id: string;
  group_name: string;
  selection_type: "single" | "multiple";
  minimum_selections: number;
  maximum_selections: number;
};

type OptionRow = {
  id: string;
  group_id: string;
  name: string;
  additional_price_cents: number;
  active: boolean;
  sold_out: boolean;
};

export async function priceOrderItems(
  sql: postgres.TransactionSql,
  requestItems: ConfirmOrderRequest["items"],
  products: OrderProductRow[],
): Promise<PricedOrderLine[]> {
  const productIds = Array.from(
    new Set(requestItems.map((item) => item.productId)),
  );
  const optionIds = Array.from(
    new Set(
      requestItems.flatMap((item) =>
        item.selections.map((selection) => selection.optionId),
      ),
    ),
  );
  const [groupLinks, options] = await Promise.all([
    sql.unsafe<GroupLinkRow[]>(
      `SELECT pag.product_id, ag.id AS group_id, ag.name AS group_name,
              ag.selection_type,
              COALESCE(pag.minimum_selections, ag.minimum_selections)
                AS minimum_selections,
              COALESCE(pag.maximum_selections, ag.maximum_selections)
                AS maximum_selections
       FROM product_addon_groups pag
       JOIN addon_groups ag ON ag.id = pag.group_id
       WHERE pag.product_id = ANY($1::TEXT[])
         AND ag.builder_role IS NOT NULL AND ag.active = TRUE`,
      [productIds],
    ),
    optionIds.length
      ? sql.unsafe<OptionRow[]>(
          `SELECT id, group_id, name, additional_price_cents, active, sold_out
           FROM addon_options
           WHERE id = ANY($1::TEXT[])`,
          [optionIds],
        )
      : Promise.resolve([]),
  ]);

  const productById = new Map(
    products.map((product) => [product.product_id, product]),
  );
  const optionById = new Map(options.map((option) => [option.id, option]));
  const quantitiesByProduct = new Map<string, number>();
  for (const item of requestItems) {
    quantitiesByProduct.set(
      item.productId,
      (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
    );
  }

  for (const product of products) {
    const quantity = quantitiesByProduct.get(product.product_id) ?? 0;
    if (!product.product_active || product.sold_out) {
      throw new OrderRequestError(
        `${product.name} está indisponível no momento.`,
        409,
      );
    }
    if (product.order_limit !== null && quantity > product.order_limit) {
      throw new OrderRequestError(
        `O limite de ${product.name} é ${product.order_limit} por pedido.`,
        409,
      );
    }
    if (product.stock_quantity !== null && quantity > product.stock_quantity) {
      throw new OrderRequestError(
        `Não há quantidade suficiente de ${product.name}.`,
        409,
      );
    }
  }

  return requestItems.map((item) => {
    const product = productById.get(item.productId);
    if (!product) {
      throw new OrderRequestError(
        "Um dos produtos não pertence mais ao cardápio.",
        409,
      );
    }
    const links = groupLinks.filter(
      (link) => link.product_id === item.productId,
    );
    if (!links.length && item.selections.length) {
      throw new OrderRequestError(
        `${product.name} não aceita opções de montagem.`,
        409,
      );
    }

    const addons = item.selections.map((selection) => {
      const option = optionById.get(selection.optionId);
      const link = option
        ? links.find((candidate) => candidate.group_id === option.group_id)
        : null;
      if (!option || !link) {
        throw new OrderRequestError(
          "Uma das opções não pertence a esta marmita.",
          409,
        );
      }
      if (!option.active || option.sold_out) {
        throw new OrderRequestError(
          `${option.name} está indisponível no momento.`,
          409,
        );
      }
      return {
        optionId: option.id,
        groupName: link.group_name,
        name: option.name,
        unitPriceInCents: option.additional_price_cents,
        quantity: selection.quantity,
      };
    });

    for (const link of links) {
      const count = addons
        .filter((addon) =>
          item.selections.some(
            (selection) =>
              selection.optionId === addon.optionId &&
              optionById.get(selection.optionId)?.group_id === link.group_id,
          ),
        )
        .reduce((total, addon) => total + addon.quantity, 0);
      if (count < link.minimum_selections || count > link.maximum_selections) {
        throw new OrderRequestError(
          `Revise a etapa "${link.group_name}" de ${product.name}.`,
          409,
        );
      }
      if (link.selection_type === "single" && count > 1) {
        throw new OrderRequestError(
          `Escolha apenas uma opção em "${link.group_name}".`,
          409,
        );
      }
    }

    const unitPriceInCents =
      product.promotional_price_cents ?? product.price_cents;
    return {
      ...product,
      quantity: item.quantity,
      notes: item.notes,
      unitPriceInCents,
      addonTotalInCents: addons.reduce(
        (total, addon) =>
          total + addon.unitPriceInCents * addon.quantity,
        0,
      ),
      addons,
    };
  });
}
