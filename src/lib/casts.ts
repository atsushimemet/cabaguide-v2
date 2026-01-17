import { getAreaMap } from "@/lib/areas";
import { fetchLatestFollowersByCastIds } from "@/lib/castFollowers";
import { getServiceSupabaseClient } from "@/lib/supabaseServer";
import { Cast } from "@/types/cast";
import { Area } from "@/types/area";

export const PAGE_SIZE = 10;

const PLACEHOLDER_IMAGE = "/images/top-casts/placeholder.svg";
const ACCENT_COLORS = [
  "#f472b6",
  "#c084fc",
  "#a5b4fc",
  "#67e8f9",
  "#fda4af",
  "#f0abfc",
  "#bef264",
  "#f9a8d4",
  "#a78bfa",
  "#7dd3fc",
];

type CastRow = {
  id: string;
  name: string;
  image_url: string | null;
  store_id: string;
  created_at: string;
};

type StoreRow = {
  id: string;
  area_id: number;
  name: string;
  google_map_link: string;
  phone: string;
};

type CastFollowerTotalRow = {
  cast_id: string;
  followers: number;
};

const buildStoreMap = (rows: StoreRow[]) => {
  const map = new Map<string, StoreRow>();
  rows.forEach((row) => map.set(row.id, row));
  return map;
};

const fetchLatestFollowerTotals = async (castIds: string[]): Promise<Record<string, number>> => {
  if (castIds.length === 0) {
    return {};
  }

  const supabase = getServiceSupabaseClient();
  const followersMap = await fetchLatestFollowersByCastIds(supabase, castIds);

  const totals: Record<string, number> = {};
  Object.entries(followersMap).forEach(([castId, followers]) => {
    totals[castId] = (followers.instagram ?? 0) + (followers.tiktok ?? 0);
  });
  return totals;
};

const mapCastRowToCard = (
  row: CastRow,
  store: StoreRow | undefined,
  areaMap: Map<number, Area>,
  followers: number,
  accentIndex: number
): Cast | null => {
  if (!store) {
    return null;
  }

  const area = areaMap.get(store.area_id);
  if (!area) {
    return null;
  }

  return {
    id: row.id,
    downtownId: store.area_id,
    prefecture: area.todofukenName,
    downtownName: area.downtownName,
    name: row.name,
    followers,
    storeId: store.id,
    storeName: store.name,
    image: row.image_url ?? PLACEHOLDER_IMAGE,
    castLink: `/casts/${store.area_id}/${row.id}`,
    storeLink: `/stores/${store.id}`,
    accent: ACCENT_COLORS[accentIndex % ACCENT_COLORS.length],
    badgeText: area.downtownName,
  };
};

const fetchStoreRowsByArea = async (downtownId: number): Promise<StoreRow[]> => {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("stores")
    .select("id, area_id, name, google_map_link, phone")
    .eq("area_id", downtownId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StoreRow[];
};

const fetchStoreRowsByIds = async (storeIds: string[]): Promise<StoreRow[]> => {
  if (storeIds.length === 0) {
    return [];
  }
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("stores")
    .select("id, area_id, name, google_map_link, phone")
    .in("id", storeIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StoreRow[];
};

const CastFetchChunkSize = 1000;

const fetchCastRowsByStoreIds = async (storeIds: string[]): Promise<CastRow[]> => {
  if (storeIds.length === 0) {
    return [];
  }

  const supabase = getServiceSupabaseClient();
  const rows: CastRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("casts")
      .select("id, name, image_url, store_id, created_at")
      .in("store_id", storeIds)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + CastFetchChunkSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    const chunk = (data ?? []) as CastRow[];
    rows.push(...chunk);

    if (chunk.length < CastFetchChunkSize) {
      break;
    }

    offset += CastFetchChunkSize;
  }

  return rows;
};

const fetchCastRowsByIds = async (castIds: string[]): Promise<CastRow[]> => {
  if (castIds.length === 0) {
    return [];
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("casts")
    .select("id, name, image_url, store_id, created_at")
    .in("id", castIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CastRow[];
};

const fetchTopCastFollowerTotals = async (limit: number): Promise<CastFollowerTotalRow[]> => {
  if (limit <= 0) {
    return [];
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("cast_latest_follower_totals")
    .select("cast_id, followers")
    .order("followers", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CastFollowerTotalRow[];
};

export const getPaginatedCasts = async (
  downtownId: number,
  page: number,
  perPage: number = PAGE_SIZE
): Promise<{
  casts: Cast[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> => {
  const storeRows = await fetchStoreRowsByArea(downtownId);
  const storeIds = storeRows.map((store) => store.id);
  const storeMap = buildStoreMap(storeRows);

  const areaMap = await getAreaMap();
  const castRows = await fetchCastRowsByStoreIds(storeIds);
  const castIds = castRows.map((row) => row.id);
  const followerTotals = await fetchLatestFollowerTotals(castIds);

  const allCasts: Cast[] = [];
  castRows.forEach((row, index) => {
    const cast = mapCastRowToCard(
      row,
      storeMap.get(row.store_id),
      areaMap,
      followerTotals[row.id] ?? 0,
      index
    );
    if (cast) {
      allCasts.push(cast);
    }
  });

  allCasts.sort((a, b) => b.followers - a.followers);
  const totalCount = allCasts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const requestedPage = Number.isFinite(page) ? page : 1;
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const start = (currentPage - 1) * perPage;
  const casts = allCasts.slice(start, start + perPage);

  return {
    casts,
    totalCount,
    totalPages,
    currentPage,
  };
};

export const getTopCasts = async (limit = 10): Promise<Cast[]> => {
  const safeLimit = Math.max(1, limit);
  const areaMap = await getAreaMap();
  const followerRows = await fetchTopCastFollowerTotals(safeLimit * 2);
  const castIds = followerRows.map((row) => row.cast_id);
  const castRows = await fetchCastRowsByIds(castIds);
  const storeIds = Array.from(new Set(castRows.map((row) => row.store_id)));
  const storeRows = await fetchStoreRowsByIds(storeIds);
  const storeMap = buildStoreMap(storeRows);

  const followerTotals: Record<string, number> = {};
  followerRows.forEach((row) => {
    followerTotals[row.cast_id] = Number(row.followers ?? 0);
  });

  const mapped: Cast[] = [];
  castRows.forEach((row, index) => {
    const cast = mapCastRowToCard(
      row,
      storeMap.get(row.store_id),
      areaMap,
      followerTotals[row.id] ?? 0,
      index
    );
    if (cast) {
      mapped.push(cast);
    }
  });

  mapped.sort((a, b) => b.followers - a.followers);
  return mapped.slice(0, safeLimit);
};

export const getCastsByStoreId = async (storeId: string): Promise<Cast[]> => {
  if (!storeId) {
    return [];
  }

  const areaMap = await getAreaMap();
  const castRows = await fetchCastRowsByStoreIds([storeId]);
  const followerTotals = await fetchLatestFollowerTotals(castRows.map((row) => row.id));
  const storeRows = await fetchStoreRowsByIds([storeId]);
  const storeMap = buildStoreMap(storeRows);

  const casts: Cast[] = [];
  castRows.forEach((row, index) => {
    const cast = mapCastRowToCard(
      row,
      storeMap.get(row.store_id),
      areaMap,
      followerTotals[row.id] ?? 0,
      index
    );
    if (cast) {
      casts.push(cast);
    }
  });

  casts.sort((a, b) => b.followers - a.followers);
  return casts;
};
