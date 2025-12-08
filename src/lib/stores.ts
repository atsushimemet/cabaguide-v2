import { getServiceSupabaseClient } from "@/lib/supabaseServer";
import { Store, StoreBasePricing, StoreTimeSlotPricing } from "@/types/store";

type BasePricingRow = {
  nomination_price: number | null;
  service_fee_rate: number | string | null;
};

type TimeSlotRow = {
  time_slot: number | null;
  main_price: number | null;
};

const formatTimeSlotLabel = (value: number | null) => {
  const normalized = Number.isFinite(value) ? Number(value) : 0;
  const clamped = Math.max(0, Math.min(24, normalized));
  return `${String(clamped).padStart(2, "0")}:00`;
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
    .map((row) => ({
      timeSlot: formatTimeSlotLabel(row.time_slot),
      mainPrice: row.main_price ?? 0,
    }))
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot, "ja"));
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

  const { data: slotRows, error: slotError } = await supabase
    .from("store_time_slot_pricings")
    .select("time_slot, main_price")
    .eq("store_id", storeId)
    .order("time_slot", { ascending: true });

  if (slotError) {
    throw new Error(slotError.message);
  }

  return {
    id: storeRow.id,
    areaId: storeRow.area_id,
    name: storeRow.name,
    googleMapLink: storeRow.google_map_link,
    phone: storeRow.phone,
    basePricing: toBasePricing(baseRow),
    timeSlots: toTimeSlots(slotRows ?? []),
  };
};
