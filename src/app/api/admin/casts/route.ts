import { NextResponse } from "next/server";

import { ensureAdminSession } from "@/lib/adminAuth";
import { fetchLatestFollowersByCastIds } from "@/lib/castFollowers";
import { getServiceSupabaseClient, SupabaseServiceEnvError } from "@/lib/supabaseServer";

type CastRow = {
  id: string;
  name: string;
  store_id: string;
  age?: number | null;
  image_url?: string | null;
  created_at?: string;
};

const CAST_FETCH_CHUNK_SIZE = 1000;

const fetchStoreIdsByAreaId = async (
  supabase: ReturnType<typeof getServiceSupabaseClient>,
  areaId: number
): Promise<string[]> => {
  const { data, error } = await supabase.from("stores").select("id").eq("area_id", areaId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.id);
};

const fetchStoreIdsByPrefecture = async (
  supabase: ReturnType<typeof getServiceSupabaseClient>,
  prefecture: string
): Promise<string[]> => {
  const { data: areaRows, error: areaError } = await supabase
    .from("areas")
    .select("id")
    .eq("todofuken_name", prefecture);

  if (areaError) {
    throw new Error(areaError.message);
  }

  const areaIds = (areaRows ?? []).map((row) => row.id);
  if (areaIds.length === 0) {
    return [];
  }

  const { data: storeRows, error: storeError } = await supabase
    .from("stores")
    .select("id")
    .in("area_id", areaIds);

  if (storeError) {
    throw new Error(storeError.message);
  }

  return (storeRows ?? []).map((row) => row.id);
};

const fetchAllCasts = async (
  supabase: ReturnType<typeof getServiceSupabaseClient>,
  storeIds?: string[] | null
): Promise<CastRow[]> => {
  if (Array.isArray(storeIds) && storeIds.length === 0) {
    return [];
  }

  const casts: CastRow[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("casts")
      .select("id, name, store_id, age, image_url, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + CAST_FETCH_CHUNK_SIZE - 1);

    if (Array.isArray(storeIds) && storeIds.length > 0) {
      query = query.in("store_id", storeIds);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as CastRow[];
    casts.push(...rows);

    if (rows.length < CAST_FETCH_CHUNK_SIZE) {
      break;
    }

    from += CAST_FETCH_CHUNK_SIZE;
  }

  return casts;
};

export async function GET(request: Request) {
  const unauthorized = await ensureAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  let supabase;
  try {
    supabase = getServiceSupabaseClient();
  } catch (error) {
    if (error instanceof SupabaseServiceEnvError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw error;
  }

  const url = new URL(request.url);
  const prefectureParam = url.searchParams.get("prefecture")?.trim();
  const areaIdParam = url.searchParams.get("areaId")?.trim();

  let storeIdsFilter: string[] | null = null;

  if (areaIdParam) {
    const areaId = Number(areaIdParam);
    if (!Number.isFinite(areaId)) {
      return NextResponse.json({ error: "無効な繁華街 ID です" }, { status: 400 });
    }
    storeIdsFilter = await fetchStoreIdsByAreaId(supabase, areaId);
  } else if (prefectureParam) {
    storeIdsFilter = await fetchStoreIdsByPrefecture(supabase, prefectureParam);
  }

  try {
    const casts = await fetchAllCasts(supabase, storeIdsFilter);
    const castIds = casts.map((cast) => cast.id);
    const followersMap =
      castIds.length > 0 ? await fetchLatestFollowersByCastIds(supabase, castIds) : {};

    return NextResponse.json({ casts, followers: followersMap });
  } catch (error) {
    console.error("[admin/casts][GET]", error);
    const message = error instanceof Error ? error.message : "キャスト一覧の取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await ensureAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { storeId, name, age, imageUrl } = body;

  if (!storeId || !name) {
    return NextResponse.json({ error: "店舗とキャスト名は必須です" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getServiceSupabaseClient();
  } catch (error) {
    if (error instanceof SupabaseServiceEnvError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw error;
  }

  try {
    const { error } = await supabase.from("casts").insert({
      store_id: storeId,
      name,
      age: age ?? null,
      image_url: imageUrl ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/casts]", error);
    const message = error instanceof Error ? error.message : "キャスト登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
