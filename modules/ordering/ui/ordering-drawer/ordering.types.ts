import type { StorefrontProduct } from "@/modules/storefront/domain/storefront.types";

export type CartItem = {
  product: StorefrontProduct;
  quantity: number;
};

export type OrderSuccess = {
  orderNumber: number;
  trackingToken: string;
  totalInCents: number;
};
