import { NextResponse } from "next/server";

import { ensureAdminSession } from "@/lib/adminAuth";
import { getServiceSupabaseClient, SupabaseServiceEnvError } from "@/lib/supabaseServer";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const unauthorized = ensureAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

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
