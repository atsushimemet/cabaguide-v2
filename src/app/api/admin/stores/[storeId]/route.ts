import { NextResponse } from "next/server";

import { ensureAdminSession } from "@/lib/adminAuth";
import { getServiceSupabaseClient, SupabaseServiceEnvError } from "@/lib/supabaseServer";

type TimeSlotInput = {
  timeSlotHour: number;
  timeSlotMinute: number;
  mainPrice: number;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ storeId: string }> | { storeId: string } }
) {
  const unauthorized = await ensureAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  const params = await context.params;
  const storeId = params.storeId;

  if (!storeId) {
    return NextResponse.json({ error: "店舗IDが指定されていません" }, { status: 400 });
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
    // 店舗基本情報を取得
    const { data: storeRow, error: storeError } = await supabase
      .from("stores")
      .select("id, area_id, name, google_map_link, phone, homepage_link")
      .eq("id", storeId)
      .single();

    if (storeError) {
      throw new Error(storeError.message);
    }

    if (!storeRow) {
      return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
    }

    // 基本料金情報を取得
    const { data: baseRow, error: baseError } = await supabase
      .from("store_base_pricings")
      .select("nomination_price, service_fee_rate")
      .eq("store_id", storeId)
      .maybeSingle();

    if (baseError) {
      throw new Error(baseError.message);
    }

    // タイムスロット料金情報を取得
    const { data: slotRows, error: slotError } = await supabase
      .from("store_time_slot_pricings")
      .select("time_slot_hour, time_slot_minute, main_price")
      .eq("store_id", storeId)
      .order("time_slot_hour", { ascending: true })
      .order("time_slot_minute", { ascending: true });

    if (slotError) {
      // レガシーカラム（time_slot）を試す
      const { data: legacyRows, error: legacyError } = await supabase
        .from("store_time_slot_pricings")
        .select("time_slot, main_price")
        .eq("store_id", storeId)
        .order("time_slot", { ascending: true });

      if (legacyError) {
        throw new Error(legacyError.message);
      }

      return NextResponse.json({
        store: {
          id: storeRow.id,
          areaId: storeRow.area_id,
          name: storeRow.name,
          googleMapUrl: storeRow.google_map_link,
          phone: storeRow.phone,
          homepageLink: storeRow.homepage_link ?? null,
          nominationPrice: baseRow?.nomination_price ?? null,
          serviceFeeRate: baseRow?.service_fee_rate ?? null,
          timeSlots: (legacyRows ?? []).map((row) => ({
            timeSlotHour: row.time_slot ?? 20,
            timeSlotMinute: 0,
            mainPrice: row.main_price ?? 0,
          })),
        },
      });
    }

    return NextResponse.json({
      store: {
        id: storeRow.id,
        areaId: storeRow.area_id,
        name: storeRow.name,
        googleMapUrl: storeRow.google_map_link,
        phone: storeRow.phone,
        homepageLink: storeRow.homepage_link ?? null,
        nominationPrice: baseRow?.nomination_price ?? null,
        serviceFeeRate: baseRow?.service_fee_rate ?? null,
        timeSlots: (slotRows ?? []).map((row) => ({
          timeSlotHour: row.time_slot_hour ?? 20,
          timeSlotMinute: row.time_slot_minute ?? 0,
          mainPrice: row.main_price ?? 0,
        })),
      },
    });
  } catch (error) {
    console.error("[admin/stores/[storeId]][GET]", error);
    const message = error instanceof Error ? error.message : "店舗詳細の取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ storeId: string }> | { storeId: string } }
) {
  const unauthorized = await ensureAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  const params = await context.params;
  const storeId = params.storeId;

  if (!storeId) {
    return NextResponse.json({ error: "店舗IDが指定されていません" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const {
    areaId,
    name,
    googleMapUrl,
    phone,
    homepageLink,
    nominationPrice,
    serviceFeeRate,
    timeSlots,
  } = body;

  if (!areaId || !name || !googleMapUrl || !phone || !Array.isArray(timeSlots)) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
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
    // 店舗基本情報を更新
    const updatePayload: {
      area_id: number;
      name: string;
      google_map_link: string;
      phone: string;
      homepage_link?: string | null;
    } = {
      area_id: areaId,
      name,
      google_map_link: googleMapUrl,
      phone,
    };

    if (homepageLink !== undefined) {
      updatePayload.homepage_link = homepageLink || null;
    }

    const { error: storeError } = await supabase
      .from("stores")
      .update(updatePayload)
      .eq("id", storeId);

    if (storeError) {
      throw new Error(storeError.message);
    }

    // 基本料金情報を更新（存在する場合は更新、存在しない場合は挿入）
    const basePricingPayload = {
      store_id: storeId,
      nomination_price: nominationPrice ?? null,
      service_fee_rate: serviceFeeRate ?? null,
    };

    const { data: existingBase, error: checkBaseError } = await supabase
      .from("store_base_pricings")
      .select("id")
      .eq("store_id", storeId)
      .maybeSingle();

    if (checkBaseError) {
      throw new Error(checkBaseError.message);
    }

    if (existingBase) {
      const { error: baseError } = await supabase
        .from("store_base_pricings")
        .update({
          nomination_price: basePricingPayload.nomination_price,
          service_fee_rate: basePricingPayload.service_fee_rate,
        })
        .eq("store_id", storeId);

      if (baseError) {
        throw new Error(baseError.message);
      }
    } else {
      const { error: baseError } = await supabase
        .from("store_base_pricings")
        .insert(basePricingPayload);

      if (baseError) {
        throw new Error(baseError.message);
      }
    }

    // 既存のタイムスロット料金を削除
    const { error: deleteError } = await supabase
      .from("store_time_slot_pricings")
      .delete()
      .eq("store_id", storeId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // 新しいタイムスロット料金を挿入
    const slotPayloads = (timeSlots as TimeSlotInput[]).map((slot) => ({
      store_id: storeId,
      time_slot_hour: slot.timeSlotHour,
      time_slot_minute: slot.timeSlotMinute,
      main_price: slot.mainPrice,
    }));

    const { error: slotError } = await supabase
      .from("store_time_slot_pricings")
      .insert(slotPayloads);

    if (slotError) {
      throw new Error(slotError.message);
    }

    return NextResponse.json({ ok: true, storeId });
  } catch (error) {
    console.error("[admin/stores/[storeId]][PUT]", error);
    const message = error instanceof Error ? error.message : "店舗更新に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
