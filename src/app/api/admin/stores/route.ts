import { NextResponse } from "next/server";

import { ensureAdminSession } from "@/lib/adminAuth";
import { getServiceSupabaseClient } from "@/lib/supabaseServer";

type TimeSlotInput = {
  timeSlot: number;
  mainPrice: number;
  vipPrice?: number | null;
};

export async function POST(request: Request) {
  const unauthorized = ensureAdminSession();
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
    nominationPrice,
    serviceFeeRate,
    taxRate,
    extensionPrice,
    lightDrinkPrice,
    cheapestChampagnePrice,
    timeSlots,
  } = body;

  if (!areaId || !name || !googleMapUrl || !phone || !Array.isArray(timeSlots)) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const supabase = getServiceSupabaseClient();

  try {
    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .insert({
        area_id: areaId,
        name,
        google_map_link: googleMapUrl,
        phone,
      })
      .select("id")
      .single();

    if (storeError || !storeData?.id) {
      throw storeError ?? new Error("store_id を取得できませんでした");
    }

    const storeId = storeData.id;

    const basePricingPayload = {
      store_id: storeId,
      nomination_price: nominationPrice ?? null,
      service_fee_rate: serviceFeeRate ?? null,
      tax_rate: taxRate ?? null,
      extension_price: extensionPrice ?? null,
      light_drink_price: lightDrinkPrice ?? null,
      cheapest_champagne_price: cheapestChampagnePrice ?? null,
    };

    const { error: baseError } = await supabase.from("store_base_pricings").insert(basePricingPayload);
    if (baseError) {
      throw baseError;
    }

    const slotPayloads = (timeSlots as TimeSlotInput[]).map((slot) => ({
      store_id: storeId,
      time_slot: slot.timeSlot,
      main_price: slot.mainPrice,
      vip_price: slot.vipPrice ?? null,
    }));

    const { error: slotError } = await supabase.from("store_time_slot_pricings").insert(slotPayloads);
    if (slotError) {
      throw slotError;
    }

    return NextResponse.json({ ok: true, storeId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "店舗登録に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
