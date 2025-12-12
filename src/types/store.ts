export type StoreBasePricing = {
  nominationPrice: number | null;
  serviceFeeRate: number | null;
};

export type StoreTimeSlotPricing = {
  hour: number;
  minute: number;
  label: string;
  startMinutes: number;
  mainPrice: number;
};

export type Store = {
  id: string;
  areaId: number;
  name: string;
  googleMapLink: string;
  phone: string;
  homepageLink?: string;
  basePricing: StoreBasePricing;
  timeSlots: StoreTimeSlotPricing[];
};
