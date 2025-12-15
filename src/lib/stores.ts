import { getAreaMap } from "@/lib/areas";
import { getServiceSupabaseClient } from "@/lib/supabaseServer";
import { Store, StoreBasePricing, StoreRankingEntry, StoreTimeSlotPricing } from "@/types/store";

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
  const rawRate = row?.service_fee_rate;
  const rawNomination = row?.nomination_price;
  return {
    nominationPrice:
      rawNomination === undefined || rawNomination === null ? null : Number(rawNomination),
    serviceFeeRate:
      rawRate === undefined || rawRate === null || rawRate === ""
        ? null
        : Number(rawRate),
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

const isMissingHomepageLinkError = (message?: string) => {
  if (!message) {
    return false;
  }
  return message.includes("homepage_link");
};

const normalizeHomepageLink = (value?: string | null): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "null") {
    return undefined;
  }
  return trimmed;
};

type StoreRow = {
  id: string;
  area_id: number;
  name: string;
};

type StoreFollowerSnapshotRow = {
  store_id: string;
  followers: number | null;
  captured_at: string | null;
};

export const getStoreById = async (storeId: string): Promise<Store | null> => {
  if (!storeId) {
    return null;
  }

  const supabase = getServiceSupabaseClient();

  let storeRow: {
    id: string;
    area_id: number;
    name: string;
    google_map_link: string;
    phone: string;
    homepage_link?: string | null;
  } | null = null;

  const { data: storeRowWithHomepage, error: storeError } = await supabase
    .from("stores")
    .select("id, area_id, name, google_map_link, phone, homepage_link")
    .eq("id", storeId)
    .single();

  if (storeError) {
    if (isMissingHomepageLinkError(storeError.message)) {
      // homepage_linkカラムが存在しない場合は、homepage_linkなしで再クエリ
      const { data: storeRowWithoutHomepage, error: storeErrorWithoutHomepage } = await supabase
        .from("stores")
        .select("id, area_id, name, google_map_link, phone")
        .eq("id", storeId)
        .single();

      if (storeErrorWithoutHomepage) {
        throw new Error(storeErrorWithoutHomepage.message);
      }

      storeRow = storeRowWithoutHomepage ? { ...storeRowWithoutHomepage, homepage_link: null } : null;
    } else {
      throw new Error(storeError.message);
    }
  } else {
    storeRow = storeRowWithHomepage;
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
    homepageLink: normalizeHomepageLink(storeRow.homepage_link),
    basePricing: toBasePricing(baseRow),
    timeSlots,
  };
};

export const getStoreFollowerRankingsByPrefecture = async (
  prefectureName: string,
  limit = 10
): Promise<StoreRankingEntry[]> => {
  if (!prefectureName) {
    return [];
  }

  const areaMap = await getAreaMap();
  const areaIds = Array.from(areaMap.entries())
    .filter(([, area]) => area.todofukenName === prefectureName)
    .map(([areaId]) => areaId);

  if (areaIds.length === 0) {
    return [];
  }

  const supabase = getServiceSupabaseClient();

  const { data: storeRows, error: storeError } = await supabase
    .from("stores")
    .select("id, name, area_id")
    .in("area_id", areaIds);

  if (storeError) {
    throw new Error(storeError.message);
  }

  const typedStoreRows = (storeRows ?? []) as StoreRow[];

  if (typedStoreRows.length === 0) {
    return [];
  }

  const storeIds = typedStoreRows.map((row) => row.id);

  const { data: snapshotRows, error: snapshotError } = await supabase
    .from("store_latest_follower_snapshots")
    .select("store_id, followers, captured_at")
    .in("store_id", storeIds);

  if (snapshotError) {
    throw new Error(snapshotError.message);
  }

  const latestMap = new Map<string, StoreFollowerSnapshotRow>();
  (snapshotRows ?? []).forEach((row) => {
    if (!row) {
      return;
    }
    const typedRow = row as StoreFollowerSnapshotRow;
    latestMap.set(typedRow.store_id, typedRow);
  });

  return typedStoreRows
    .map((row) => {
      const area = areaMap.get(row.area_id);
      if (!area) {
        return null;
      }
      const latest = latestMap.get(row.id);
      if (!latest) {
        return null;
      }

      return {
        storeId: row.id,
        storeName: row.name,
        areaId: row.area_id,
        todofukenName: area.todofukenName,
        downtownName: area.downtownName,
        followers: Number(latest.followers ?? 0),
        capturedAt: latest.captured_at ?? undefined,
      } satisfies StoreRankingEntry;
    })
    .filter((entry): entry is StoreRankingEntry => entry !== null)
    .sort((a, b) => {
      if (b.followers !== a.followers) {
        return b.followers - a.followers;
      }
      return a.storeName.localeCompare(b.storeName, "ja");
    })
    .slice(0, Math.max(1, limit));
};
