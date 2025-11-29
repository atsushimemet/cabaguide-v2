export type StoreBasePricing = {
  nominationPrice: number;
  serviceFeeRate: number;
  taxRate: number;
  extensionPrice: number;
  lightDrinkPrice?: number;
  cheapestChampagnePrice: number;
};

export type StoreTimeSlotPricing = {
  timeSlot: string;
  mainPrice: number;
  vipPrice: number;
};

export type Store = {
  id: string;
  slug: string;
  areaId: number;
  name: string;
  googleMapLink: string;
  phone: string;
  basePricing: StoreBasePricing;
  timeSlots: StoreTimeSlotPricing[];
};
