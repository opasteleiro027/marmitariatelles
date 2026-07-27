export type PricedOrderItem = {
  unitPriceInCents: number;
  quantity: number;
  addonTotalInCents?: number;
};

export type OrderTotal = {
  subtotalInCents: number;
  deliveryFeeInCents: number;
  discountInCents: number;
  totalInCents: number;
};

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
}

export function calculateOrderTotal(
  items: PricedOrderItem[],
  deliveryFeeInCents: number,
  discountInCents = 0,
): OrderTotal {
  assertNonNegativeInteger(deliveryFeeInCents, "deliveryFeeInCents");
  assertNonNegativeInteger(discountInCents, "discountInCents");

  const subtotalInCents = items.reduce((total, item) => {
    assertNonNegativeInteger(item.unitPriceInCents, "unitPriceInCents");
    assertNonNegativeInteger(item.addonTotalInCents ?? 0, "addonTotalInCents");
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error("quantity must be a positive integer");
    }

    return (
      total +
      (item.unitPriceInCents + (item.addonTotalInCents ?? 0)) * item.quantity
    );
  }, 0);

  const totalBeforeDiscount = subtotalInCents + deliveryFeeInCents;
  const appliedDiscount = Math.min(discountInCents, totalBeforeDiscount);

  return {
    subtotalInCents,
    deliveryFeeInCents,
    discountInCents: appliedDiscount,
    totalInCents: totalBeforeDiscount - appliedDiscount,
  };
}

export function validateChangeAmount(
  totalInCents: number,
  changeForInCents: number | null,
): boolean {
  if (changeForInCents === null) return true;
  return (
    Number.isInteger(changeForInCents) &&
    changeForInCents >= totalInCents
  );
}
