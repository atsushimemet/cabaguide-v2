import { NextResponse } from "next/server";

import { ensureAdminSession } from "@/lib/adminAuth";
import { getServiceSupabaseClient, SupabaseServiceEnvError } from "@/lib/supabaseServer";

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
      .from("areas")
      .select("id, todofuken_name, downtown_name")
      .order("id", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ areas: data ?? [] });
  } catch (error) {
    console.error("[admin/areas][GET]", error);
    const message = error instanceof Error ? error.message : "エリア一覧の取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
