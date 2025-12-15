import { NextResponse } from "next/server";

import { ensureAdminSession } from "@/lib/adminAuth";
import { getServiceSupabaseClient, SupabaseServiceEnvError } from "@/lib/supabaseServer";

type SnapshotRow = {
  id: string;
  platform: string;
  followers: number;
  captured_at: string;
};

type CastUpdatePayload = {
  name?: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const unauthorized = await ensureAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  const params = await context.params;
  const castId = params.id;

  if (!castId) {
    return NextResponse.json({ error: "cast_id が指定されていません" }, { status: 400 });
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
    const { data: castData, error: castError } = await supabase
      .from("casts")
      .select("id, name, store_id, age, image_url")
      .eq("id", castId)
      .single();

    if (castError) {
      throw new Error(castError.message);
    }

    if (!castData) {
      return NextResponse.json({ error: "キャストが見つかりません" }, { status: 404 });
    }

    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select("id, name")
      .eq("id", castData.store_id)
      .single();

    if (storeError) {
      throw new Error(storeError.message);
    }

    const { data: snapshotsData, error: snapshotsError } = await supabase
      .from("cast_follower_snapshots")
      .select("id, platform, followers, captured_at")
      .eq("cast_id", castId)
      .order("captured_at", { ascending: false })
      .limit(20);

    if (snapshotsError) {
      throw new Error(snapshotsError.message);
    }

    const snapshots = (snapshotsData ?? []) as SnapshotRow[];
    const latest: { instagram?: number; tiktok?: number } = {};
    snapshots.forEach((row) => {
      if (row.platform === "instagram" && latest.instagram === undefined) {
        latest.instagram = row.followers;
      }
      if (row.platform === "tiktok" && latest.tiktok === undefined) {
        latest.tiktok = row.followers;
      }
    });

    const { data: socialLinksData, error: socialLinksError } = await supabase
      .from("cast_social_links")
      .select("id, cast_id, platform, url, created_at, updated_at")
      .eq("cast_id", castId)
      .order("created_at", { ascending: false });

    if (socialLinksError) {
      throw new Error(socialLinksError.message);
    }

    return NextResponse.json({
      cast: castData,
      store: storeData ?? null,
      snapshots,
      latestFollowers: latest,
      socialLinks: socialLinksData ?? [],
    });
  } catch (error) {
    console.error(`[admin/casts/${castId}]`, error);
    const message = error instanceof Error ? error.message : "キャスト詳細の取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const unauthorized = await ensureAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  const params = await context.params;
  const castId = params.id;

  if (!castId) {
    return NextResponse.json({ error: "cast_id が指定されていません" }, { status: 400 });
  }

  const payload = (await request.json().catch(() => null)) as CastUpdatePayload | null;
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "キャスト名を入力してください" }, { status: 400 });
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
      .update({ name })
      .eq("id", castId)
      .select("id, name")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return NextResponse.json({ error: "キャストが見つかりません" }, { status: 404 });
    }

    return NextResponse.json({ cast: data });
  } catch (error) {
    console.error(`[admin/casts/${castId}][PATCH]`, error);
    const message = error instanceof Error ? error.message : "キャスト名の更新に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
