import type { StorefrontProduct } from "@/modules/storefront/domain/storefront.types";

export type CartItem = {
  lineId: string;
  product: StorefrontProduct;
  quantity: number;
  selections: Array<{
    groupId: string;
    groupName: string;
    optionId: string;
    optionName: string;
    additionalPriceInCents: number;
    quantity: number;
  }>;
  notes: string;
};

export type OrderSuccess = {
  orderNumber: number;
  trackingToken: string;
  totalInCents: number;
};

export function cartItemUnitPrice(item: CartItem) {
  const productPrice =
    item.product.promotionalPriceInCents ?? item.product.priceInCents;
  const additions = item.selections.reduce(
    (total, selection) =>
      total + selection.additionalPriceInCents * selection.quantity,
    0,
  );
  return productPrice + additions;
}
