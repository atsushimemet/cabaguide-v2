"use client";

import Link from "next/link";
import type { InputHTMLAttributes } from "react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { AdminFooter } from "@/components/AdminFooter";
import { PageFrame } from "@/components/PageFrame";
import { areas as fallbackAreas } from "@/data/areas";
import { useAdminGuard } from "@/hooks/useAdminSession";
import { useSupabaseBrowserClient } from "@/hooks/useSupabaseBrowserClient";
import { SERVICE_FEE_OPTIONS, TIME_SLOT_OPTIONS } from "@/lib/adminOptions";

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

type TimeSlotFormItem = {
  id: string; // 一意のID（追加時に生成）
  hour: string;
  minute: string;
  main: string;
};

type TimeSlotForm = TimeSlotFormItem[];

type StoreFormState = {
  areaId: string;
  name: string;
  googleMapUrl: string;
  phone: string;
  homepageLink: string;
  nominationPrice: string;
  serviceFeeRate: string;
  timeSlots: TimeSlotForm;
};

// 0-59分のすべての分を選択肢として提供
const TIME_SLOT_MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
// 0-24時のすべての時間を選択肢として提供
const TIME_SLOT_HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => i); // 0-24

// タイムスロットの範囲を計算する関数
const calculateTimeSlotRange = (timeSlots: TimeSlotForm): { min: string; max: string } | null => {
  if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
    return null;
  }
  
  const times = timeSlots.map((slot) => {
    const hour = Number(slot.hour);
    const minute = Number(slot.minute);
    return hour * 60 + minute;
  });
  
  const minMinutes = Math.min(...times);
  const maxMinutes = Math.max(...times);
  
  const minHour = Math.floor(minMinutes / 60);
  const minMin = minMinutes % 60;
  
  // 最大値は常に25:00として表示
  const maxHour = 25;
  const maxMin = 0;
  
  return {
    min: `${String(minHour).padStart(2, "0")}:${String(minMin).padStart(2, "0")}`,
    max: `${String(maxHour).padStart(2, "0")}:${String(maxMin).padStart(2, "0")}`,
  };
};

const generateTimeSlotId = () => `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createInitialTimeSlots = (): TimeSlotForm =>
  TIME_SLOT_OPTIONS.map((hour) => ({
    id: generateTimeSlotId(),
    hour: String(hour),
    minute: "00",
    main: "",
  }));

const createDefaultFormState = (): StoreFormState => ({
  areaId: "",
  name: "",
  googleMapUrl: "",
  phone: "",
  homepageLink: "",
  nominationPrice: "",
  serviceFeeRate: "",
  timeSlots: createInitialTimeSlots(),
});

export default function AdminShopPage() {
  const { isChecking, isAuthenticated, logout } = useAdminGuard();
  const { client, error: clientError } = useSupabaseBrowserClient();
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
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
    if (!isAuthenticated) {
      return;
    }
    setIsLoadingStores(true);
    setStoresError(null);
    try {
      const response = await fetch("/api/admin/stores", { credentials: "include" });
      if (response.status === 401) {
        setStoresError("管理者セッションの有効期限が切れました。再度ログインしてください。");
        await logout();
        return;
      }
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "店舗一覧の取得に失敗しました");
      }
      setStores((payload?.stores as StoreRow[]) ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "店舗一覧の取得に失敗しました";
      setStoresError(message);
    } finally {
      setIsLoadingStores(false);
    }
  }, [isAuthenticated, logout]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    fetchStores();
  }, [fetchStores, isAuthenticated]);

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

  const isHundredUnit = (value: string) => {
    if (!value) {
      return true;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return false;
    }
    return numeric % 100 === 0;
  };

  const updateTimeSlotField = (slotId: string, field: keyof TimeSlotFormItem, value: string) => {
    setFormState((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot) =>
        slot.id === slotId ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const addTimeSlot = () => {
    setFormState((prev) => ({
      ...prev,
      timeSlots: [
        ...prev.timeSlots,
        {
          id: generateTimeSlotId(),
          hour: "20",
          minute: "00",
          main: "",
        },
      ],
    }));
  };

  const removeTimeSlot = (slotId: string) => {
    setFormState((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((slot) => slot.id !== slotId),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormSuccess(null);
    setFormError(null);

    if (!isAuthenticated) {
      setFormError("管理者セッションを確認できませんでした。再度ログインしてください。");
      return;
    }

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

    // タイムスロットのバリデーション
    if (formState.timeSlots.length === 0) {
      setFormError("少なくとも1つのタイムスロットを設定してください");
      return;
    }

    const missingSlot = formState.timeSlots.find((slot) => !slot.main);
    if (missingSlot) {
      const hour = Number(missingSlot.hour);
      const minute = Number(missingSlot.minute);
      const timeLabel = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      setFormError(`${timeLabel} のメイン料金を入力してください`);
      return;
    }

    const invalidSlot = formState.timeSlots.find((slot) => {
      const minute = Number(slot.minute);
      if (!Number.isFinite(minute) || minute < 0 || minute > 59) {
        return true;
      }
      if (!TIME_SLOT_MINUTE_OPTIONS.includes(slot.minute)) {
        return true;
      }
      if (!isHundredUnit(slot.main)) {
        return true;
      }
      const hour = Number(slot.hour);
      if (!Number.isFinite(hour) || hour < 0 || hour > 24) {
        return true;
      }
      return false;
    });
    if (invalidSlot) {
      const hour = Number(invalidSlot.hour);
      const minute = Number(invalidSlot.minute);
      const timeLabel = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      setFormError(`${timeLabel} の料金は100円刻みで入力してください`);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      areaId: Number(formState.areaId),
      name: formState.name,
      googleMapUrl: formState.googleMapUrl,
      phone: formState.phone,
      homepageLink: formState.homepageLink || null,
      nominationPrice: parseNumber(formState.nominationPrice),
      serviceFeeRate: parseNumber(formState.serviceFeeRate),
      timeSlots: formState.timeSlots.map((slot) => ({
        timeSlotHour: Number(slot.hour),
        timeSlotMinute: Number(slot.minute),
        mainPrice: Number(slot.main),
      })),
    };

    try {
      const response = await fetch("/api/admin/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        setFormError("管理者セッションの有効期限が切れました。再度ログインしてください。");
        await logout();
        setIsSubmitting(false);
        return;
      }

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
    <PageFrame mainClassName="gap-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">Store</p>
              <h1 className="text-2xl font-semibold">店舗登録</h1>
            </div>
            <Link
              href="/admin"
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              /admin
            </Link>
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

            <Field
              label="ホームページ URL"
              value={formState.homepageLink}
              onChange={(value) => setFormState((prev) => ({ ...prev, homepageLink: value }))}
              placeholder="https://example.com"
            />

            <Field
              label="指名料金"
              value={formState.nominationPrice}
              onChange={(value) => setFormState((prev) => ({ ...prev, nominationPrice: value }))}
              placeholder="3300"
              type="number"
              inputMode="numeric"
              min="0"
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

            <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-4">
              <div>
                {(() => {
                  const range = calculateTimeSlotRange(formState.timeSlots);
                  const rangeText = range ? `${range.min}〜${range.max}` : "19:00〜25:00";
                  return (
                    <p className="text-base font-semibold text-white">時間帯別料金 ({rangeText})</p>
                  );
                })()}
                <p className="text-sm text-white/60">各時間帯の開始時間と通常席（メイン）料金を入力してください。</p>
              </div>
              <div className="space-y-4">
                {formState.timeSlots
                  .sort((a, b) => {
                    const aMinutes = Number(a.hour) * 60 + Number(a.minute);
                    const bMinutes = Number(b.hour) * 60 + Number(b.minute);
                    return aMinutes - bMinutes;
                  })
                  .map((slot) => {
                    const hour = Number(slot.hour);
                    const minute = Number(slot.minute);
                    const timeLabel = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
                    return (
                      <div key={slot.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-white">{timeLabel} 帯</p>
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(slot.id)}
                            className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-1 text-xs text-red-200 transition hover:bg-red-500/20"
                          >
                            削除
                          </button>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2fr]">
                          <label className="text-sm text-white/70">
                            時間
                            <select
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
                              value={slot.hour}
                              onChange={(event) => updateTimeSlotField(slot.id, "hour", event.target.value)}
                            >
                              {TIME_SLOT_HOUR_OPTIONS.map((hourOption) => (
                                <option key={hourOption} value={hourOption}>
                                  {hourOption}時
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-sm text-white/70">
                            開始分
                            <select
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
                              value={slot.minute}
                              onChange={(event) => updateTimeSlotField(slot.id, "minute", event.target.value)}
                            >
                              {TIME_SLOT_MINUTE_OPTIONS.map((minuteOption) => (
                                <option key={minuteOption} value={minuteOption}>
                                  {minuteOption}分
                                </option>
                              ))}
                            </select>
                          </label>
                          <Field
                            label="メイン料金 (必須)"
                            value={slot.main}
                            onChange={(value) => updateTimeSlotField(slot.id, "main", value)}
                            type="number"
                            inputMode="numeric"
                            step="100"
                            min="0"
                            placeholder="例: 7800"
                          />
                        </div>
                      </div>
                    );
                  })}
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  + 時間帯を追加
                </button>
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
            {storesError && (
              <p className="rounded-xl border border-yellow-500/60 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-100">
                {storesError}
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
                    <Link
                      href={`/admin/store/${store.id}`}
                      className="block transition hover:opacity-80"
                    >
                      <p className="text-base font-semibold text-white underline-offset-4 hover:underline">
                        {store.name}
                      </p>
                    </Link>
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

      <AdminFooter onLogout={logout} />
    </PageFrame>
  );
}

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
  inputMode,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  step?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  min?: InputHTMLAttributes<HTMLInputElement>["min"];
}) => (
  <label className="block text-sm text-white/70">
    {label}
    <input
      type={type}
      step={step}
      inputMode={inputMode}
      min={min}
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
  <PageFrame mainClassName="flex min-h-[320px] items-center justify-center">
    <p className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/80">{message}</p>
  </PageFrame>
);
