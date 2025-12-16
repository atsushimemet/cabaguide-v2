import { NextResponse } from "next/server";

import { ensureAdminSession } from "@/lib/adminAuth";
import { getServiceSupabaseClient, SupabaseServiceEnvError } from "@/lib/supabaseServer";

type FollowersRow = {
  cast_id: string;
  platform: string;
  followers: number;
  captured_at: string;
};

export async function GET() {
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

  try {
    const { data, error } = await supabase
      .from("casts")
      .select("id, name, store_id, age, image_url, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const casts = data ?? [];
    const castIds = casts.map((cast) => cast.id);
    const followersMap: Record<string, { instagram?: number; tiktok?: number }> = {};

    if (castIds.length > 0) {
      const { data: followersData, error: followersError } = await supabase
        .from("cast_follower_snapshots")
        .select("cast_id, platform, followers, captured_at")
        .in("cast_id", castIds)
        .order("captured_at", { ascending: false });

      if (followersError) {
        throw new Error(followersError.message);
      }

      const rows = (followersData ?? []) as FollowersRow[];
      for (const row of rows) {
        const castId = row.cast_id;
        if (!followersMap[castId]) {
          followersMap[castId] = {};
        }
        if (row.platform === "instagram" && followersMap[castId].instagram === undefined) {
          followersMap[castId].instagram = row.followers;
        }
        if (row.platform === "tiktok" && followersMap[castId].tiktok === undefined) {
          followersMap[castId].tiktok = row.followers;
        }
      }
    }

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
