import { CHAMPAGNE_PRICE, LIGHT_DRINKS_PER_GUEST, LIGHT_DRINK_UNIT_PRICE } from "@/lib/pricing";
import { CONSUMPTION_TAX_RATE } from "@/lib/tax";
import { Store, StoreTimeSlotPricing } from "@/types/store";

export type BudgetParams = {
  startTime: string;
  guestCount: number;
  nominationCount: number;
  useVipSeat: boolean;
};

export type BudgetScenario = {
  id: "drinks" | "drinks_and_champagne";
  label: string;
  description: string;
  guestTotal: number;
  nominationTotal: number;
  drinkTotal: number;
  extrasLabel?: string;
  extrasAmount: number;
  subtotal: number;
  serviceFee: number;
  tax: number;
  total: number;
};

export type BudgetBreakdown = {
  timeSlots: Array<{ label: string; pricePerPerson: number }>;
  scenarios: BudgetScenario[];
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

const createScenario = (
  store: Store,
  params: Pick<BudgetParams, "guestCount" | "nominationCount"> & { timeSlots: StoreTimeSlotPricing[]; useVipSeat: boolean },
  extraCost: number,
  meta: { id: BudgetScenario["id"]; label: string; description: string; extrasLabel?: string }
): BudgetScenario => {
  const guestCount = Math.max(1, ensurePositiveInteger(params.guestCount, 1));
  const nominationCount = ensurePositiveInteger(params.nominationCount, 0);

  const perHourTotal = params.timeSlots.reduce((sum, slot) => {
    const pricePerPerson = params.useVipSeat ? slot.vipPrice : slot.mainPrice;
    return sum + pricePerPerson;
  }, 0);
  const guestTotal = perHourTotal * guestCount;

  const nominationTotal = store.basePricing.nominationPrice * nominationCount * 2;
  const drinkTotal = LIGHT_DRINKS_PER_GUEST * LIGHT_DRINK_UNIT_PRICE * guestCount;

  const subtotal = guestTotal + nominationTotal + drinkTotal + extraCost;
  const serviceFee = Math.round(subtotal * store.basePricing.serviceFeeRate);
  const afterService = subtotal + serviceFee;
  const tax = Math.round(afterService * CONSUMPTION_TAX_RATE);
  const total = afterService + tax;

  return {
    id: meta.id,
    label: meta.label,
    description: meta.description,
    guestTotal,
    nominationTotal,
    drinkTotal,
    extrasLabel: extraCost > 0 ? meta.extrasLabel : undefined,
    extrasAmount: extraCost,
    subtotal,
    serviceFee,
    tax,
    total,
  };
};

export const calculateBudget = (store: Store, params: BudgetParams): BudgetBreakdown => {
  const sortedSlots = normalizeTimeSlots(store.timeSlots);
  const selectedSlots = pickTwoHours(sortedSlots, params.startTime);

  const timeSlots = selectedSlots.map((slot) => ({
    label: slot.timeSlot,
    pricePerPerson: params.useVipSeat ? slot.vipPrice : slot.mainPrice,
  }));

  const baseScenarioParams = {
    guestCount: 1,
    nominationCount: params.nominationCount,
    timeSlots: selectedSlots,
    useVipSeat: params.useVipSeat,
  };

  const drinksOnly = createScenario(
    store,
    baseScenarioParams,
    0,
    {
      id: "drinks",
      label: "ドリンクのみ",
      description: `キャストに1人あたり${LIGHT_DRINKS_PER_GUEST}杯（${LIGHT_DRINK_UNIT_PRICE.toLocaleString("ja-JP")}円/杯）を振る舞う想定`,
    }
  );

  const withChampagne = createScenario(
    store,
    baseScenarioParams,
    CHAMPAGNE_PRICE,
    {
      id: "drinks_and_champagne",
      label: "ドリンク + シャンパン",
      description: `上記に加えてシャンパン1本（${CHAMPAGNE_PRICE.toLocaleString("ja-JP")}円）を追加`,
      extrasLabel: "シャンパン",
    }
  );

  return {
    timeSlots,
    scenarios: [drinksOnly, withChampagne],
  };
};
