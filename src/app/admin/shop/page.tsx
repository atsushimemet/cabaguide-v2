"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { useAdminGuard } from "@/hooks/useAdminSession";
import { useSupabaseBrowserClient } from "@/hooks/useSupabaseBrowserClient";
import {
  EXTENSION_PRICE_OPTIONS,
  MAIN_PRICE_OPTIONS,
  NOMINATION_PRICE_OPTIONS,
  SERVICE_FEE_OPTIONS,
  TIME_SLOT_OPTIONS,
  VIP_PRICE_OPTIONS,
} from "@/lib/adminOptions";
import { areas as fallbackAreas } from "@/data/areas";

type AreaOption = {
  id: number;
  label: string;
};

type AreaRow = {
  id: number;
  todofuken_name: string;
  downtown_name: string;
};
type StoreRow = {
  id: string;
  name: string;
  area_id: number | null;
  phone?: string | null;
  created_at?: string;
};

type TimeSlotForm = Record<
  number,
  {
    main: string;
    vip: string;
  }
>;

type StoreFormState = {
  areaId: string;
  name: string;
  googleMapUrl: string;
  phone: string;
  nominationPrice: string;
  serviceFeeRate: string;
  taxRate: string;
  extensionPrice: string;
  lightDrinkPrice: string;
  cheapestChampagnePrice: string;
  timeSlots: TimeSlotForm;
};

const createInitialTimeSlots = (): TimeSlotForm =>
  TIME_SLOT_OPTIONS.reduce((acc, slot) => {
    acc[slot] = { main: "", vip: "" };
    return acc;
  }, {} as TimeSlotForm);

const createDefaultFormState = (): StoreFormState => ({
  areaId: "",
  name: "",
  googleMapUrl: "",
  phone: "",
  nominationPrice: "",
  serviceFeeRate: "",
  taxRate: "0.10",
  extensionPrice: "",
  lightDrinkPrice: "2000",
  cheapestChampagnePrice: "25000",
  timeSlots: createInitialTimeSlots(),
});

export default function AdminShopPage() {
  const { isChecking, isAuthenticated, logout } = useAdminGuard();
  const { client, error: clientError } = useSupabaseBrowserClient();
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [formState, setFormState] = useState<StoreFormState>(() => createDefaultFormState());
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const areaOptions: AreaOption[] = fallbackAreas.map((area) => ({
      id: area.id,
      label: `${area.todofukenName} / ${area.downtownName}`,
    }));
    setAreas(areaOptions);
  }, []);

  useEffect(() => {
    const fetchAreas = async () => {
      if (!client) {
        return;
      }
      const { data } = await client
        .from("areas")
        .select("id, todofuken_name, downtown_name")
        .order("id", { ascending: true });
      if (data && data.length > 0) {
        setAreas(
          data.map((row) => {
            const typedRow = row as AreaRow;
            return {
              id: typedRow.id,
              label: `${typedRow.todofuken_name} / ${typedRow.downtown_name}`,
            };
          })
        );
      }
    };
    fetchAreas();
  }, [client]);

  const fetchStores = useCallback(async () => {
    if (!client) {
      return;
    }
    setIsLoadingStores(true);
    const { data, error } = await client
      .from("stores")
      .select("id, name, area_id, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setStores(data as StoreRow[]);
    }
    setIsLoadingStores(false);
  }, [client]);

  useEffect(() => {
    if (client) {
      fetchStores();
    }
  }, [client, fetchStores]);

  const areaMap = useMemo(() => {
    const map = new Map<number, string>();
    areas.forEach((area) => map.set(area.id, area.label));
    return map;
  }, [areas]);

  const parseNumber = (value: string) => {
    if (!value) {
      return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const updateTimeSlotField = (slot: number, field: "main" | "vip", value: string) => {
    setFormState((prev) => ({
      ...prev,
      timeSlots: {
        ...prev.timeSlots,
        [slot]: {
          ...prev.timeSlots[slot],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormSuccess(null);
    setFormError(null);

    if (!client) {
      setFormError(clientError ?? "Supabase クライアントを初期化できませんでした");
      return;
    }

    const requiredFields: (keyof StoreFormState)[] = [
      "areaId",
      "name",
      "googleMapUrl",
      "phone",
    ];

    const missing = requiredFields.find((field) => !(formState[field] as string));
    if (missing) {
      setFormError("必須項目をすべて入力してください");
      return;
    }

    const missingSlot = TIME_SLOT_OPTIONS.find(
      (slot) => !formState.timeSlots[slot] || !formState.timeSlots[slot].main
    );
    if (missingSlot !== undefined) {
      setFormError(`${missingSlot}:00 のメイン料金を入力してください`);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      areaId: Number(formState.areaId),
      name: formState.name,
      googleMapUrl: formState.googleMapUrl,
      phone: formState.phone,
      nominationPrice: parseNumber(formState.nominationPrice),
      serviceFeeRate: parseNumber(formState.serviceFeeRate),
      taxRate: parseNumber(formState.taxRate),
      extensionPrice: parseNumber(formState.extensionPrice),
      lightDrinkPrice: parseNumber(formState.lightDrinkPrice),
      cheapestChampagnePrice: parseNumber(formState.cheapestChampagnePrice),
      timeSlots: TIME_SLOT_OPTIONS.map((slot) => ({
        timeSlot: slot,
        mainPrice: Number(formState.timeSlots[slot].main),
        vipPrice: formState.timeSlots[slot].vip ? Number(formState.timeSlots[slot].vip) : null,
      })),
    };

    try {
      const response = await fetch("/api/admin/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setFormError(data?.error ?? "店舗登録に失敗しました");
        setIsSubmitting(false);
        return;
      }

      setFormSuccess("店舗を登録しました");
      setFormState(createDefaultFormState());
      fetchStores();
    } catch (err) {
      const message = err instanceof Error ? err.message : "店舗登録に失敗しました";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return <AdminLoading />;
  }

  if (!isAuthenticated) {
    return <AdminLoading message="認証リダイレクト中" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">Store</p>
              <h1 className="text-2xl font-semibold">店舗登録 / admin shop</h1>
              <p className="text-sm text-white/70">
                営業中のスマホから、繁華街・料金テーブル込みで登録できます。
              </p>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              ログアウト
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold">店舗情報を登録</h2>
          <p className="mt-1 text-sm text-white/70">
            必須項目を入力し、料金設定は選択ピッカーでサクッと入力できます。
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm text-white/70">繁華街 (必須)</label>
              <select
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                value={formState.areaId}
                onChange={(event) => setFormState((prev) => ({ ...prev, areaId: event.target.value }))}
                required
              >
                <option value="">エリアを選択</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.label}
                  </option>
                ))}
              </select>
            </div>

            <Field
              label="店舗名 (必須)"
              value={formState.name}
              onChange={(value) => setFormState((prev) => ({ ...prev, name: value }))}
              placeholder="BAR CabaGuide"
            />

            <Field
              label="Googleマップ URL (必須)"
              value={formState.googleMapUrl}
              onChange={(value) => setFormState((prev) => ({ ...prev, googleMapUrl: value }))}
              placeholder="https://maps.google.com/..."
            />

            <Field
              label="電話番号 (必須)"
              value={formState.phone}
              onChange={(value) => setFormState((prev) => ({ ...prev, phone: value }))}
              placeholder="03-1234-5678"
            />

            <SelectField
              label="指名料金"
              value={formState.nominationPrice}
              onChange={(value) => setFormState((prev) => ({ ...prev, nominationPrice: value }))}
              options={NOMINATION_PRICE_OPTIONS}
              unit="円"
              placeholder="未設定"
            />

            <SelectField
              label="サービス料率"
              value={formState.serviceFeeRate}
              onChange={(value) => setFormState((prev) => ({ ...prev, serviceFeeRate: value }))}
              options={SERVICE_FEE_OPTIONS}
              unit="%"
              formatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
              placeholder="未設定"
            />

            <Field
              label="税率"
              value={formState.taxRate}
              type="number"
              step="0.01"
              onChange={(value) => setFormState((prev) => ({ ...prev, taxRate: value }))}
              placeholder="0.10"
            />

            <SelectField
              label="延長料金"
              value={formState.extensionPrice}
              onChange={(value) => setFormState((prev) => ({ ...prev, extensionPrice: value }))}
              options={EXTENSION_PRICE_OPTIONS}
              unit="円"
              placeholder="未設定"
            />

            <Field
              label="軽ドリンク目安価格"
              value={formState.lightDrinkPrice}
              type="number"
              onChange={(value) => setFormState((prev) => ({ ...prev, lightDrinkPrice: value }))}
              placeholder="2000"
            />

            <Field
              label="最安シャンパン目安価格"
              value={formState.cheapestChampagnePrice}
              type="number"
              onChange={(value) => setFormState((prev) => ({ ...prev, cheapestChampagnePrice: value }))}
              placeholder="25000"
            />

            <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-4">
              <div>
                <p className="text-base font-semibold text-white">タイムスロット料金 (20:00〜24:00)</p>
                <p className="text-sm text-white/60">各時間帯のメイン/VIP料金を入力してください。</p>
              </div>
              <div className="space-y-4">
                {TIME_SLOT_OPTIONS.map((slot) => (
                  <div key={slot} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm font-semibold text-white">{slot}:00 帯</p>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <SelectField
                        label="メイン料金 (必須)"
                        value={formState.timeSlots[slot]?.main ?? ""}
                        onChange={(value) => updateTimeSlotField(slot, "main", value)}
                        options={MAIN_PRICE_OPTIONS}
                        unit="円"
                        placeholder="金額を選択"
                        required
                      />
                      <SelectField
                        label="VIP料金 (任意)"
                        value={formState.timeSlots[slot]?.vip ?? ""}
                        onChange={(value) => updateTimeSlotField(slot, "vip", value)}
                        options={VIP_PRICE_OPTIONS}
                        unit="円"
                        placeholder="金額を選択"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {formError && (
              <p className="rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm text-red-100">
                {formError}
              </p>
            )}

            {formSuccess && (
              <p className="rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
                {formSuccess}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 px-4 py-3 text-base font-semibold shadow-lg shadow-purple-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "登録中..." : "店舗を登録"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">登録済み店舗</h2>
              <p className="mt-1 text-sm text-white/70">最新 20 件を表示しています。</p>
            </div>
            <button
              onClick={fetchStores}
              className="text-sm text-white/70 underline-offset-4 hover:underline"
              disabled={isLoadingStores}
            >
              {isLoadingStores ? "更新中" : "再読み込み"}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {clientError && (
              <p className="rounded-xl border border-yellow-500/60 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-100">
                {clientError}
              </p>
            )}
            {!client && !clientError && (
              <p className="rounded-xl border border-yellow-500/60 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-100">
                Supabase クライアント初期化中...
              </p>
            )}

            {stores.length === 0 && !isLoadingStores ? (
              <p className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
                まだ店舗が登録されていません。
              </p>
            ) : (
              <ul className="space-y-3">
                {stores.map((store) => (
                  <li key={store.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-base font-semibold">{store.name}</p>
                    <p className="text-sm text-white/60">
                      {areaMap.get(store.area_id ?? 0) ?? `area_id: ${store.area_id ?? "-"}`}
                    </p>
                    {store.phone && (
                      <p className="text-sm text-white/50">TEL: {store.phone}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
}) => (
  <label className="block text-sm text-white/70">
    {label}
    <input
      type={type}
      step={step}
      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  </label>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  unit,
  formatter,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: number[];
  placeholder?: string;
  unit?: string;
  formatter?: (value: string) => string;
  required?: boolean;
}) => (
  <label className="block text-sm text-white/70">
    {label}
    <select
      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
    >
      <option value="">{placeholder ?? "選択してください"}</option>
      {options.map((option) => {
        const optionValue = option.toString();
        const label = formatter
          ? formatter(optionValue)
          : `${optionValue}${unit ?? ""}`;
        return (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        );
      })}
    </select>
  </label>
);

const AdminLoading = ({ message = "読み込み中" }: { message?: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
    <p className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/80">{message}</p>
  </div>
);
