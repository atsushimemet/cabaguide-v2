"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { InputHTMLAttributes } from "react";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { AdminFooter } from "@/components/AdminFooter";
import { PageFrame } from "@/components/PageFrame";
import { useAdminGuard } from "@/hooks/useAdminSession";
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

type StoreData = {
  id: string;
  areaId: number;
  name: string;
  googleMapUrl: string;
  phone: string;
  homepageLink: string | null;
  nominationPrice: number | null;
  serviceFeeRate: number | null;
  timeSlots: {
    timeSlotHour: number;
    timeSlotMinute: number;
    mainPrice: number;
  }[];
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
  if (timeSlots.length === 0) {
    return null;
  }
  
  const times = timeSlots.map((slot) => {
    const hour = Number(slot.hour);
    const minute = Number(slot.minute);
    return hour * 60 + minute;
  });
  
  const minMinutes = Math.min(...times);
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

const populateFormState = (store: StoreData): StoreFormState => {
  // 既存のタイムスロットデータをフォームに設定
  // データベースに存在するすべてのタイムスロットを含める
  const timeSlots: TimeSlotForm = store.timeSlots.map((slot) => ({
    id: generateTimeSlotId(),
    hour: String(slot.timeSlotHour),
    minute: String(slot.timeSlotMinute).padStart(2, "0"),
    main: String(slot.mainPrice),
  }));

  // データベースにタイムスロットが存在しない場合は、デフォルト値を追加
  if (timeSlots.length === 0) {
    return {
      areaId: String(store.areaId),
      name: store.name,
      googleMapUrl: store.googleMapUrl,
      phone: store.phone,
      homepageLink: store.homepageLink ?? "",
      nominationPrice: store.nominationPrice != null ? String(store.nominationPrice) : "",
      serviceFeeRate: store.serviceFeeRate != null ? String(store.serviceFeeRate) : "",
      timeSlots: createInitialTimeSlots(),
    };
  }

  return {
    areaId: String(store.areaId),
    name: store.name,
    googleMapUrl: store.googleMapUrl,
    phone: store.phone,
    homepageLink: store.homepageLink ?? "",
    nominationPrice: store.nominationPrice != null ? String(store.nominationPrice) : "",
    serviceFeeRate: store.serviceFeeRate != null ? String(store.serviceFeeRate) : "",
    timeSlots,
  };
};

export default function AdminShopEditPage() {
  const params = useParams<{ storeId: string }>();
  const router = useRouter();
  const storeId = params?.storeId;
  const { isChecking, isAuthenticated, logout } = useAdminGuard();
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [store, setStore] = useState<StoreData | null>(null);
  const [isLoadingStore, setIsLoadingStore] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [formState, setFormState] = useState<StoreFormState>(() => createDefaultFormState());
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    const fetchAreas = async () => {
      try {
        const response = await fetch("/api/admin/areas", { credentials: "include" });
        if (response.status === 401) {
          await logout();
          return;
        }
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "エリア一覧の取得に失敗しました");
        }
        const data = payload?.areas as AreaRow[] | undefined;
        if (data && data.length > 0) {
          setAreas(
            data.map((row) => ({
              id: row.id,
              label: `${row.todofuken_name} / ${row.downtown_name}`,
            }))
          );
        }
      } catch (error) {
        console.error("[admin/store/edit] fetchAreas", error);
      }
    };
    fetchAreas();
  }, [isAuthenticated, logout]);

  const fetchStore = useCallback(async () => {
    if (!storeId || !isAuthenticated) {
      return;
    }
    setIsLoadingStore(true);
    setStoreError(null);
    try {
      const response = await fetch(`/api/admin/stores/${storeId}`, { credentials: "include" });
      if (response.status === 401) {
        setStoreError("管理者セッションの有効期限が切れました。再度ログインしてください。");
        await logout();
        return;
      }
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "店舗詳細の取得に失敗しました");
      }
      const storeData = payload?.store as StoreData | null;
      if (storeData) {
        setStore(storeData);
      } else {
        setStoreError("店舗が見つかりません");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "店舗詳細の取得に失敗しました";
      setStoreError(message);
    } finally {
      setIsLoadingStore(false);
    }
  }, [storeId, isAuthenticated, logout]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    fetchStore();
  }, [fetchStore, isAuthenticated]);

  useEffect(() => {
    if (store) {
      setFormState(populateFormState(store));
    }
  }, [store]);

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

    if (!storeId) {
      setFormError("店舗IDが指定されていません");
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
      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PUT",
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
        setFormError(data?.error ?? "店舗更新に失敗しました");
        setIsSubmitting(false);
        return;
      }

      setFormSuccess("店舗を更新しました");
      setTimeout(() => {
        router.push("/admin/store");
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "店舗更新に失敗しました";
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

  if (isLoadingStore) {
    return <AdminLoading message="店舗情報を読み込み中" />;
  }

  if (storeError) {
    return (
      <PageFrame mainClassName="gap-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <section className="rounded-3xl border border-red-500/60 bg-red-500/10 p-6">
            <h2 className="text-xl font-semibold text-red-100">エラー</h2>
            <p className="mt-2 text-sm text-red-200">{storeError}</p>
            <Link
              href="/admin/store"
              className="mt-4 inline-block rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              店舗一覧に戻る
            </Link>
          </section>
        </div>
        <AdminFooter onLogout={logout} />
      </PageFrame>
    );
  }

  return (
    <PageFrame mainClassName="gap-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">Store</p>
              <h1 className="text-2xl font-semibold">店舗情報を更新</h1>
            </div>
            <Link
              href="/admin/store"
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              /admin/store
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold">店舗情報を編集</h2>
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
              {isSubmitting ? "更新中..." : "店舗を更新"}
            </button>
          </form>
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
