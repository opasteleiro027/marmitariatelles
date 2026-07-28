export type LocatedAddress = {
  postalCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  approximate: boolean;
  attribution: string | null;
};

export type DeliveryAreaReference = {
  id: string;
  neighborhood: string;
  city: string;
};

export type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;
  city?: string;
  town?: string;
  municipality?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country_code?: string;
  "ISO3166-2-lvl4"?: string;
};
