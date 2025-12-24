import { NextResponse } from "next/server";

import { ensureAdminSession } from "@/lib/adminAuth";
import { getServiceSupabaseClient, SupabaseServiceEnvError } from "@/lib/supabaseServer";

export async function POST(
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

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { instagram, tiktok } = body;

  const payload: { platform: string; followers: number; cast_id: string }[] = [];

  if (instagram) {
    payload.push({ platform: "instagram", followers: instagram, cast_id: castId });
  }
  if (tiktok) {
    payload.push({ platform: "tiktok", followers: tiktok, cast_id: castId });
  }

  if (payload.length === 0) {
    return NextResponse.json({ error: "フォロワー数を入力してください" }, { status: 400 });
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
    const insertPayload = payload.map((row) => ({
      ...row,
      captured_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("cast_follower_snapshots").insert(insertPayload);
    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[admin/casts/${castId}/followers]`, error);
    const message = error instanceof Error ? error.message : "フォロワー更新に失敗しました";
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

  const url = new URL(request.url);
  const snapshotId = url.searchParams.get("snapshotId");
  if (!snapshotId) {
    return NextResponse.json({ error: "snapshotId を指定してください" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const followers = typeof body?.followers === "number" ? body.followers : Number(body?.followers);
  if (!Number.isFinite(followers) || followers < 0) {
    return NextResponse.json({ error: "フォロワー数は0以上の数値で入力してください" }, { status: 400 });
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
      .from("cast_follower_snapshots")
      .update({ followers })
      .eq("id", snapshotId)
      .eq("cast_id", castId)
      .select("id, followers, platform, captured_at")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return NextResponse.json({ error: "スナップショットが見つかりません" }, { status: 404 });
    }

    return NextResponse.json({ snapshot: data });
  } catch (error) {
    console.error(`[admin/casts/${castId}/followers][PATCH]`, error);
    const message = error instanceof Error ? error.message : "フォロワー履歴の更新に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
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

  const url = new URL(request.url);
  const snapshotId = url.searchParams.get("snapshotId");
  if (!snapshotId) {
    return NextResponse.json({ error: "snapshotId を指定してください" }, { status: 400 });
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
    const { error } = await supabase
      .from("cast_follower_snapshots")
      .delete()
      .eq("id", snapshotId)
      .eq("cast_id", castId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[admin/casts/${castId}/followers][DELETE]`, error);
    const message = error instanceof Error ? error.message : "フォロワー履歴の削除に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
