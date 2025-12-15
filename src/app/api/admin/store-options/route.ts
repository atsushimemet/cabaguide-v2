import { NextResponse } from "next/server";

import { ensureAdminSession } from "@/lib/adminAuth";
import { getServiceSupabaseClient, SupabaseServiceEnvError } from "@/lib/supabaseServer";

type StoreOptionRow = {
  id: string;
  name: string;
  area_id: number;
  area: { id: number; todofuken_name: string; downtown_name: string } | null;
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
      .from("stores")
      .select("id, name, area_id, area:area_id (id, todofuken_name, downtown_name)")
      .order("area_id", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const stores =
      (data as StoreOptionRow[] | null)?.map((row) => ({
        id: row.id,
        name: row.name,
        areaId: row.area?.id ?? row.area_id ?? null,
        todofukenName: row.area?.todofuken_name ?? null,
        downtownName: row.area?.downtown_name ?? null,
      })) ?? [];

    return NextResponse.json({ stores });
  } catch (error) {
    console.error("[admin/store-options][GET]", error);
    const message = error instanceof Error ? error.message : "店舗一覧の取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
