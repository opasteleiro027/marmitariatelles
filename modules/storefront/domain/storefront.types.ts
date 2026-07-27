export type StorefrontProduct = {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  promotionalPriceInCents: number | null;
  category: string;
  featured: boolean;
  available: boolean;
};

export type StorefrontSnapshot = {
  businessName: string;
  welcomeMessage: string;
  ordersOpen: boolean;
  salesDateLabel: string;
  orderDeadlineLabel: string;
  deliveryWindowLabel: string;
  minimumOrderInCents: number;
  notice: string;
  whatsapp: string;
  products: StorefrontProduct[];
  source: "database" | "safe-preview";
};
