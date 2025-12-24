import { NextResponse } from "next/server";

import { ensureAdminSession } from "@/lib/adminAuth";
import { getServiceSupabaseClient, SupabaseServiceEnvError } from "@/lib/supabaseServer";

const ALLOWED_PLATFORMS = new Set(["instagram", "tiktok"]);

const resolveParams = async (context: { params: Promise<{ id: string }> | { id: string } }) => {
  return context.params instanceof Promise ? await context.params : context.params;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const unauthorized = await ensureAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id: castId } = await resolveParams(context);

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
    const { data, error } = await supabase
      .from("cast_social_links")
      .select("id, cast_id, platform, url, created_at, updated_at")
      .eq("cast_id", castId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ links: data ?? [] });
  } catch (error) {
    console.error(`[admin/casts/${castId}/social-links][GET]`, error);
    const message = error instanceof Error ? error.message : "SNS リンクの取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const unauthorized = await ensureAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id: castId } = await resolveParams(context);

  if (!castId) {
    return NextResponse.json({ error: "cast_id が指定されていません" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const platform = typeof body.platform === "string" ? body.platform : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!ALLOWED_PLATFORMS.has(platform)) {
    return NextResponse.json({ error: "未対応のプラットフォームです" }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: "URL を入力してください" }, { status: 400 });
  }

  try {
    // Validate URL format
    new URL(url);
  } catch {
    return NextResponse.json({ error: "有効な URL を入力してください" }, { status: 400 });
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
      .from("cast_social_links")
      .upsert(
        {
          cast_id: castId,
          platform,
          url,
        },
        { onConflict: "cast_id,platform" }
      )
      .select("id, cast_id, platform, url, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ link: data });
  } catch (error) {
    console.error(`[admin/casts/${castId}/social-links][POST]`, error);
    const message = error instanceof Error ? error.message : "SNS リンクの保存に失敗しました";
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

  const { id: castId } = await resolveParams(context);

  if (!castId) {
    return NextResponse.json({ error: "cast_id が指定されていません" }, { status: 400 });
  }

  const url = new URL(request.url);
  const linkId = url.searchParams.get("linkId");

  if (!linkId) {
    return NextResponse.json({ error: "linkId を指定してください" }, { status: 400 });
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
      .from("cast_social_links")
      .delete()
      .eq("id", linkId)
      .eq("cast_id", castId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[admin/casts/${castId}/social-links][DELETE]`, error);
    const message = error instanceof Error ? error.message : "SNS リンクの削除に失敗しました";
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

  const { id: castId } = await resolveParams(context);

  if (!castId) {
    return NextResponse.json({ error: "cast_id が指定されていません" }, { status: 400 });
  }

  const url = new URL(request.url);
  const linkId = url.searchParams.get("linkId");
  if (!linkId) {
    return NextResponse.json({ error: "linkId を指定してください" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const platform = typeof body.platform === "string" ? body.platform : "";
  const linkUrl = typeof body.url === "string" ? body.url.trim() : "";

  if (!ALLOWED_PLATFORMS.has(platform)) {
    return NextResponse.json({ error: "未対応のプラットフォームです" }, { status: 400 });
  }

  if (!linkUrl) {
    return NextResponse.json({ error: "URL を入力してください" }, { status: 400 });
  }

  try {
    new URL(linkUrl);
  } catch {
    return NextResponse.json({ error: "有効な URL を入力してください" }, { status: 400 });
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
      .from("cast_social_links")
      .update({
        platform,
        url: linkUrl,
      })
      .eq("id", linkId)
      .eq("cast_id", castId)
      .select("id, cast_id, platform, url, created_at, updated_at")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return NextResponse.json({ error: "SNS リンクが見つかりません" }, { status: 404 });
    }

    return NextResponse.json({ link: data });
  } catch (error) {
    console.error(`[admin/casts/${castId}/social-links][PATCH]`, error);
    const message = error instanceof Error ? error.message : "SNS リンクの更新に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
