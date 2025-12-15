import { NextResponse } from "next/server";

import { ensureAdminSession } from "@/lib/adminAuth";
import { getServiceSupabaseClient, SupabaseServiceEnvError } from "@/lib/supabaseServer";

type StoreAreaRow = {
  id: number;
  todofuken_name: string;
  downtown_name: string;
};

type StoreOptionRow = {
  id: string;
  name: string;
  area_id: number;
  area: StoreAreaRow | StoreAreaRow[] | null;
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
      (data as StoreOptionRow[] | null)?.map((row) => {
        const area = Array.isArray(row.area) ? row.area[0] ?? null : row.area ?? null;

        return {
          id: row.id,
          name: row.name,
          areaId: area?.id ?? row.area_id ?? null,
          todofukenName: area?.todofuken_name ?? null,
          downtownName: area?.downtown_name ?? null,
        };
      }) ?? [];

    return NextResponse.json({ stores });
  } catch (error) {
    console.error("[admin/store-options][GET]", error);
    const message = error instanceof Error ? error.message : "店舗一覧の取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
