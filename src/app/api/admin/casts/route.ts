import { NextResponse } from "next/server";

import { ensureAdminSession } from "@/lib/adminAuth";
import { getServiceSupabaseClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const unauthorized = ensureAdminSession();
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

  const supabase = getServiceSupabaseClient();

  try {
    const { error } = await supabase.from("casts").insert({
      store_id: storeId,
      name,
      age: age ?? null,
      image_url: imageUrl ?? null,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "キャスト登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
