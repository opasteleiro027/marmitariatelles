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
  phone: string;
  address: string;
  products: StorefrontProduct[];
  deliveryAreas: Array<{
    id: string;
    label: string;
    neighborhood: string;
    city: string;
    deliveryFeeInCents: number;
    minimumOrderInCents: number;
  }>;
  deliverySlots: Array<{
    id: string;
    label: string;
    available: boolean;
  }>;
  paymentMethods: Array<{
    id: string;
    code: string;
    label: string;
  }>;
  source: "database" | "safe-preview";
};
