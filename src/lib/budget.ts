import { CHAMPAGNE_PRICE, LIGHT_DRINKS_PER_GUEST, LIGHT_DRINK_UNIT_PRICE } from "@/lib/pricing";
import { CONSUMPTION_TAX_RATE } from "@/lib/tax";
import { Store, StoreTimeSlotPricing } from "@/types/store";

export type BudgetParams = {
  startTime: string;
  guestCount: number;
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

export type BudgetTimelineSlot = StoreTimeSlotPricing & {
  endMinutes: number;
  durationMinutes: number;
  rangeLabel: string;
};

export type BudgetStartOption = {
  value: string;
};

const DEFAULT_SLOT_DURATION = 60;
const MINUTES_LIMIT = 25 * 60;
const HOUR_BLOCK_MINUTES = 60;
const VISIT_HOURS = 2;
const ensurePositiveInteger = (value: number, fallback: number) => {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
};

const formatMinutesToLabel = (minutes: number) => {
  const normalized = Math.max(0, Math.floor(minutes));
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const formatTimelineRangeLabel = (slot: StoreTimeSlotPricing, endMinutes: number) => {
  const clampedEnd = Math.min(endMinutes, MINUTES_LIMIT);
  const endLabel = formatMinutesToLabel(clampedEnd);
  return `${slot.label} ~ ${endLabel}`;
};

const parseStartLabelToMinutes = (value: string) => {
  const [hourString, minuteString] = value.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);
  const safeHour = Number.isFinite(hour) ? Math.max(0, Math.min(24, hour)) : 0;
  const safeMinute = Number.isFinite(minute) ? Math.max(0, Math.min(59, minute)) : 0;
  return safeHour * 60 + safeMinute;
};

export const createBudgetTimeline = (timeSlots: StoreTimeSlotPricing[]): BudgetTimelineSlot[] => {
  if (!timeSlots || timeSlots.length === 0) {
    return [];
  }

  const sorted = [...timeSlots].sort((a, b) => a.startMinutes - b.startMinutes);

  return sorted.map((slot, index) => {
    const nextStart = sorted[index + 1]?.startMinutes;
    const safeNext =
      typeof nextStart === "number" && nextStart > slot.startMinutes ? nextStart : undefined;
    const fallbackEnd =
      index === sorted.length - 1 ? MINUTES_LIMIT : slot.startMinutes + DEFAULT_SLOT_DURATION;
    let endMinutes = safeNext ?? fallbackEnd;
    if (endMinutes <= slot.startMinutes) {
      endMinutes = fallbackEnd;
    }
    const durationMinutes = Math.max(1, endMinutes - slot.startMinutes);
    const rangeLabel = formatTimelineRangeLabel(slot, endMinutes);

    return {
      ...slot,
      endMinutes,
      durationMinutes,
      rangeLabel,
    };
  });
};

export const getBudgetStartOptions = (
  timeline: BudgetTimelineSlot[],
): BudgetStartOption[] => {
  if (timeline.length === 0) {
    return [];
  }

  const minHour = timeline.reduce((min, slot) => Math.min(min, slot.hour), timeline[0].hour);
  const startHour = Math.max(0, Math.min(23, minHour));
  const options: BudgetStartOption[] = [];

  for (let hour = startHour; hour <= 23; hour += 1) {
    options.push({
      value: `${String(hour).padStart(2, "0")}:00`,
    });
  }

  return options;
};

const findSlotForMinute = (timeline: BudgetTimelineSlot[], minute: number): BudgetTimelineSlot => {
  const clamped = Math.max(0, Math.min(MINUTES_LIMIT, minute));
  for (let index = timeline.length - 1; index >= 0; index -= 1) {
    if (clamped >= timeline[index].startMinutes) {
      return timeline[index];
    }
  }
  return timeline[0];
};

type HourSegment = {
  label: string;
  price: number;
};

const createHourSegments = (
  timeline: BudgetTimelineSlot[],
  startMinutes: number,
  hours = VISIT_HOURS
): HourSegment[] => {
  if (timeline.length === 0) {
    return [];
  }

  const segments: HourSegment[] = [];
  for (let offset = 0; offset < hours; offset += 1) {
    const hourStart = Math.min(startMinutes + offset * HOUR_BLOCK_MINUTES, MINUTES_LIMIT);
    const slot = findSlotForMinute(timeline, hourStart);
    const hourEnd = Math.min(hourStart + HOUR_BLOCK_MINUTES, MINUTES_LIMIT);
    segments.push({
      label: `${formatMinutesToLabel(hourStart)} ~ ${formatMinutesToLabel(hourEnd)}`,
      price: slot.mainPrice,
    });
  }
  return segments;
};

const createScenario = (
  store: Store,
  params: Pick<BudgetParams, "guestCount"> & { hourlyPrices: number[] },
  extraCost: number,
  meta: { id: BudgetScenario["id"]; label: string; description: string; extrasLabel?: string }
): BudgetScenario => {
  const guestCount = Math.max(1, ensurePositiveInteger(params.guestCount, 1));

  const perHourTotal = params.hourlyPrices.reduce((sum, price) => {
    return sum + price;
  }, 0);
  const guestTotal = perHourTotal * guestCount;

  const nominationTotal = store.basePricing.nominationPrice;
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
  const timeline = createBudgetTimeline(store.timeSlots);
  const startMinutes = parseStartLabelToMinutes(params.startTime);
  const hourSegments = createHourSegments(timeline, startMinutes);

  const timeSlots = hourSegments.map((segment) => ({
    label: segment.label,
    pricePerPerson: segment.price,
  }));

  const baseScenarioParams = {
    guestCount: params.guestCount,
    hourlyPrices: hourSegments.map((segment) => segment.price),
  };

  const drinksOnly = createScenario(
    store,
    baseScenarioParams,
    0,
    {
      id: "drinks",
      label: "ドリンクのみ",
      description: `キャストに${LIGHT_DRINKS_PER_GUEST}杯（${LIGHT_DRINK_UNIT_PRICE.toLocaleString("ja-JP")}円/杯）を振る舞う想定`,
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
