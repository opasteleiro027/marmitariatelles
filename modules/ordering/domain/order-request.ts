export type ConfirmOrderRequest = {
  idempotencyKey: string;
  customer: {
    name: string;
    phone: string;
    email: string | null;
  };
  fulfillment: "pickup" | "delivery";
  deliveryAreaId: string | null;
  deliverySlotId: string;
  paymentMethodId: string;
  changeForInCents: number | null;
  address: {
    postalCode: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    referencePoint: string | null;
  } | null;
  items: Array<{ productId: string; quantity: number }>;
};

export class OrderRequestError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "OrderRequestError";
  }
}

export function parseOrderRequest(input: unknown): ConfirmOrderRequest {
  const root = asObject(input, "Pedido inválido.");
  const customer = asObject(root.customer, "Informe os seus dados.");
  const name = requiredText(customer.name, "Informe o nome completo.", 100);
  const phone = String(customer.phone ?? "").replace(/\D/g, "");
  if (phone.length < 10 || phone.length > 13) {
    throw new OrderRequestError("Informe um telefone válido com DDD.");
  }

  const emailValue = optionalText(customer.email, 160);
  if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
    throw new OrderRequestError("Informe um e-mail válido.");
  }

  const idempotencyKey = requiredText(
    root.idempotencyKey,
    "Não foi possível identificar esta tentativa.",
    120,
  );
  const fulfillment =
    root.fulfillment === "pickup" || root.fulfillment === "delivery"
      ? root.fulfillment
      : null;
  if (!fulfillment) {
    throw new OrderRequestError("Escolha entrega ou retirada.");
  }

  const rawItems = Array.isArray(root.items) ? root.items : [];
  if (!rawItems.length || rawItems.length > 40) {
    throw new OrderRequestError("Escolha pelo menos um produto.");
  }
  const quantities = new Map<string, number>();
  for (const rawItem of rawItems) {
    const item = asObject(rawItem, "Há um item inválido no pedido.");
    const productId = requiredText(
      item.productId,
      "Há um produto inválido no pedido.",
      120,
    );
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new OrderRequestError("A quantidade de um produto é inválida.");
    }
    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
  }
  const items = Array.from(quantities, ([productId, quantity]) => {
    if (quantity > 99) {
      throw new OrderRequestError("A quantidade de um produto é inválida.");
    }
    return { productId, quantity };
  });

  const deliveryAreaId = optionalText(root.deliveryAreaId, 120);
  const deliverySlotId = requiredText(
    root.deliverySlotId,
    "Escolha um horário disponível.",
    120,
  );
  const paymentMethodId = requiredText(
    root.paymentMethodId,
    "Escolha uma forma de pagamento.",
    120,
  );

  let address: ConfirmOrderRequest["address"] = null;
  if (fulfillment === "delivery") {
    if (!deliveryAreaId) {
      throw new OrderRequestError("Escolha um bairro atendido.");
    }
    const rawAddress = asObject(root.address, "Informe o endereço de entrega.");
    address = {
      postalCode: requiredText(rawAddress.postalCode, "Informe o CEP.", 12),
      street: requiredText(rawAddress.street, "Informe a rua.", 160),
      number: requiredText(rawAddress.number, "Informe o número.", 30),
      complement: optionalText(rawAddress.complement, 100),
      neighborhood: requiredText(
        rawAddress.neighborhood,
        "Informe o bairro.",
        100,
      ),
      city: requiredText(rawAddress.city, "Informe a cidade.", 100),
      state: requiredText(rawAddress.state, "Informe o estado.", 2).toUpperCase(),
      referencePoint: optionalText(rawAddress.referencePoint, 160),
    };
  }

  return {
    idempotencyKey,
    customer: { name, phone, email: emailValue },
    fulfillment,
    deliveryAreaId: fulfillment === "delivery" ? deliveryAreaId : null,
    deliverySlotId,
    paymentMethodId,
    changeForInCents: parseMoney(root.changeFor),
    address,
    items,
  };
}

function parseMoney(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const normalized = text
    .replace(/[R$\s]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new OrderRequestError("Informe um valor válido para o troco.");
  }
  return Math.round(amount * 100);
}

function asObject(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new OrderRequestError(message);
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, message: string, maximum: number) {
  const text = String(value ?? "").trim();
  if (!text || text.length > maximum) throw new OrderRequestError(message);
  return text;
}

function optionalText(value: unknown, maximum: number) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (text.length > maximum) {
    throw new OrderRequestError("Um dos campos informados é muito longo.");
  }
  return text;
}
