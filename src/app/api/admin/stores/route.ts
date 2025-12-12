import { NextResponse } from "next/server";

import { ensureAdminSession } from "@/lib/adminAuth";
import { getServiceSupabaseClient, SupabaseServiceEnvError } from "@/lib/supabaseServer";

type TimeSlotInput = {
  timeSlotHour: number;
  timeSlotMinute: number;
  mainPrice: number;
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
      .select("id, name, area_id, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ stores: data ?? [] });
  } catch (error) {
    console.error("[admin/stores][GET]", error);
    const message = error instanceof Error ? error.message : "店舗一覧の取得に失敗しました";
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
    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .insert({
        area_id: areaId,
        name,
        google_map_link: googleMapUrl,
        phone,
        homepage_link: homepageLink ?? null,
      })
      .select("id")
      .single();
    if (storeError) {
      throw new Error(storeError.message);
    }

    if (!storeData?.id) {
      throw new Error("store_id を取得できませんでした");
    }

    const storeId = storeData.id;

    const basePricingPayload = {
      store_id: storeId,
      nomination_price: nominationPrice ?? null,
      service_fee_rate: serviceFeeRate ?? null,
    };

    const { error: baseError } = await supabase.from("store_base_pricings").insert(basePricingPayload);
    if (baseError) {
      throw new Error(baseError.message);
    }

    const slotPayloads = (timeSlots as TimeSlotInput[]).map((slot) => ({
      store_id: storeId,
      time_slot_hour: slot.timeSlotHour,
      time_slot_minute: slot.timeSlotMinute,
      main_price: slot.mainPrice,
    }));

    const { error: slotError } = await supabase.from("store_time_slot_pricings").insert(slotPayloads);
    if (slotError) {
      throw new Error(slotError.message);
    }

    return NextResponse.json({ ok: true, storeId });
  } catch (error) {
    console.error("[admin/stores]", error);
    const message = error instanceof Error ? error.message : "店舗登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
