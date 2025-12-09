import { getServiceSupabaseClient } from "@/lib/supabaseServer";
import { Store, StoreBasePricing, StoreTimeSlotPricing } from "@/types/store";

type BasePricingRow = {
  nomination_price: number | null;
  service_fee_rate: number | string | null;
};

type TimeSlotRow = {
  time_slot_hour: number | null;
  time_slot_minute: number | null;
  main_price: number | null;
};

type LegacyTimeSlotRow = {
  time_slot: number | null;
  main_price: number | null;
};

const clampNumber = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const normalizeHour = (value: number | null) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return clampNumber(Number(value), 0, 24);
};

const normalizeMinute = (value: number | null, hour: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (hour === 24) {
    return 0;
  }
  return clampNumber(Number(value), 0, 59);
};

const formatTimeSlotLabel = (hour: number, minute: number) => {
  const paddedHour = String(clampNumber(hour, 0, 24)).padStart(2, "0");
  const paddedMinute = String(clampNumber(minute, 0, 59)).padStart(2, "0");
  return `${paddedHour}:${paddedMinute}`;
};

const toMinutes = (hour: number, minute: number) => {
  const safeHour = clampNumber(hour, 0, 24);
  const cappedMinute = safeHour === 24 ? 0 : clampNumber(minute, 0, 59);
  return safeHour * 60 + cappedMinute;
};

const toBasePricing = (row?: BasePricingRow | null): StoreBasePricing => {
  return {
    nominationPrice: row?.nomination_price ?? 0,
    serviceFeeRate: row?.service_fee_rate ? Number(row.service_fee_rate) : 0,
  };
};

const toTimeSlots = (rows?: TimeSlotRow[] | null): StoreTimeSlotPricing[] => {
  if (!rows) {
    return [];
  }

  return rows
    .map((row) => {
      const hour = normalizeHour(row.time_slot_hour);
      const minute = normalizeMinute(row.time_slot_minute, hour);

      return {
        hour,
        minute,
        label: formatTimeSlotLabel(hour, minute),
        startMinutes: toMinutes(hour, minute),
        mainPrice: row.main_price ?? 0,
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);
};

const toLegacyTimeSlots = (rows?: LegacyTimeSlotRow[] | null): StoreTimeSlotPricing[] => {
  if (!rows) {
    return [];
  }

  return rows
    .map((row) => {
      const hour = normalizeHour(row.time_slot);
      const minute = 0;
      return {
        hour,
        minute,
        label: formatTimeSlotLabel(hour, minute),
        startMinutes: toMinutes(hour, minute),
        mainPrice: row.main_price ?? 0,
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);
};

const isMissingNewColumnsError = (message?: string) => {
  if (!message) {
    return false;
  }
  return message.includes("time_slot_hour") || message.includes("time_slot_minute");
};

export const getStoreById = async (storeId: string): Promise<Store | null> => {
  if (!storeId) {
    return null;
  }

  const supabase = getServiceSupabaseClient();

  const { data: storeRow, error: storeError } = await supabase
    .from("stores")
    .select("id, area_id, name, google_map_link, phone")
    .eq("id", storeId)
    .single();

  if (storeError) {
    throw new Error(storeError.message);
  }

  if (!storeRow) {
    return null;
  }

  const { data: baseRow, error: baseError } = await supabase
    .from("store_base_pricings")
    .select("nomination_price, service_fee_rate")
    .eq("store_id", storeId)
    .maybeSingle();

  if (baseError) {
    throw new Error(baseError.message);
  }

  let timeSlots: StoreTimeSlotPricing[] = [];
  const { data: slotRows, error: slotError } = await supabase
    .from("store_time_slot_pricings")
    .select("time_slot_hour, time_slot_minute, main_price")
    .eq("store_id", storeId)
    .order("time_slot_hour", { ascending: true })
    .order("time_slot_minute", { ascending: true });

  if (slotError) {
    if (isMissingNewColumnsError(slotError.message)) {
      const { data: legacyRows, error: legacyError } = await supabase
        .from("store_time_slot_pricings")
        .select("time_slot, main_price")
        .eq("store_id", storeId)
        .order("time_slot", { ascending: true });

      if (legacyError) {
        throw new Error(legacyError.message);
      }

      timeSlots = toLegacyTimeSlots(legacyRows ?? []);
    } else {
      throw new Error(slotError.message);
    }
  } else {
    timeSlots = toTimeSlots(slotRows ?? []);
  }

  return {
    id: storeRow.id,
    areaId: storeRow.area_id,
    name: storeRow.name,
    googleMapLink: storeRow.google_map_link,
    phone: storeRow.phone,
    basePricing: toBasePricing(baseRow),
    timeSlots,
  };
};
