import { CONSUMPTION_TAX_RATE } from "@/lib/tax";
import { Store, StoreTimeSlotPricing } from "@/types/store";

export type BudgetParams = {
  startTime: string;
  guestCount: number;
  nominationCount: number;
  castDrinkCountPerGuest: number;
  useVipSeat: boolean;
};

export type BudgetBreakdown = {
  timeSlots: Array<{ label: string; pricePerPerson: number }>;
  guestTotal: number;
  nominationTotal: number;
  drinkTotal: number;
  subtotal: number;
  serviceFee: number;
  tax: number;
  total: number;
  drinkUnitPrice: number;
  totalDrinkCount: number;
};

const ensurePositiveInteger = (value: number, fallback: number) => {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
};

const normalizeTimeSlots = (timeSlots: StoreTimeSlotPricing[]) => {
  return [...timeSlots].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot, "ja"));
};

const pickTwoHours = (sortedSlots: StoreTimeSlotPricing[], startTime: string): StoreTimeSlotPricing[] => {
  if (sortedSlots.length <= 2) {
    return sortedSlots.slice(0, 2);
  }

  let startIndex = sortedSlots.findIndex((slot) => slot.timeSlot === startTime);
  if (startIndex === -1) {
    startIndex = 0;
  }

  if (startIndex > sortedSlots.length - 2) {
    startIndex = Math.max(0, sortedSlots.length - 2);
  }

  return sortedSlots.slice(startIndex, startIndex + 2);
};

export const calculateBudget = (store: Store, params: BudgetParams): BudgetBreakdown => {
  const guestCount = Math.max(1, ensurePositiveInteger(params.guestCount, 1));
  const nominationCount = ensurePositiveInteger(params.nominationCount, 0);
  const castDrinkCountPerGuest = ensurePositiveInteger(params.castDrinkCountPerGuest, 0);

  const sortedSlots = normalizeTimeSlots(store.timeSlots);
  const selectedSlots = pickTwoHours(sortedSlots, params.startTime);

  const timeSlots = selectedSlots.map((slot) => ({
    label: slot.timeSlot,
    pricePerPerson: params.useVipSeat ? slot.vipPrice : slot.mainPrice,
  }));

  const hourlyTotal = timeSlots.reduce((sum, slot) => sum + slot.pricePerPerson, 0);
  const guestTotal = hourlyTotal * guestCount;

  const nominationTotal = store.basePricing.nominationPrice * nominationCount * 2;
  const drinkUnitPrice = store.basePricing.lightDrinkPrice ?? 2000;
  const totalDrinkCount = castDrinkCountPerGuest * guestCount;
  const drinkTotal = drinkUnitPrice * totalDrinkCount;
  const subtotal = guestTotal + nominationTotal + drinkTotal;
  const serviceFee = Math.round(subtotal * store.basePricing.serviceFeeRate);
  const afterService = subtotal + serviceFee;
  const tax = Math.round(afterService * CONSUMPTION_TAX_RATE);
  const total = afterService + tax;

  return {
    timeSlots,
    guestTotal,
    nominationTotal,
    drinkTotal,
    subtotal,
    serviceFee,
    tax,
    total,
    drinkUnitPrice,
    totalDrinkCount,
  };
};
