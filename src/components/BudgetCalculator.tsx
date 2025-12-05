"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";

import { BudgetBreakdown, BudgetParams, calculateBudget } from "@/lib/budget";
import { CONSUMPTION_TAX_RATE } from "@/lib/tax";
import { Store } from "@/types/store";

type BudgetCalculatorProps = {
  store: Store;
};

const currencyFormatter = new Intl.NumberFormat("ja-JP");

const formatYen = (value: number) => `${currencyFormatter.format(Math.max(0, Math.round(value)))}円`;

const defaultParams = (timeSlots: string[]): BudgetParams => {
  const startTime = timeSlots[0] ?? "20:00";

  return {
    startTime,
    guestCount: 2,
    nominationCount: 1,
    castDrinkCountPerGuest: 1,
    extensionCount: 0,
    useVipSeat: false,
  };
};

const tooltipDetails = [
  "開始時間から連続した2時間分の時間帯料金を取得し、VIP選択時はVIP料金、通常時はメイン料金を参照します。",
  "時間帯料金 × 来店人数で小計を計算します。",
  "指名料は1名あたり指名料金 × 2時間で計算します。",
  "ドリンクは店舗設定(なければ2,000円) × 杯数で加算します。",
  "延長は回数 × 延長料金、最後にサービス料→消費税(10%)の順に乗算します。",
];

type NumericField = "guestCount" | "nominationCount" | "castDrinkCountPerGuest" | "extensionCount";
const guestCountOptions = [1, 2, 3, 4, 5];
const zeroToFiveOptions = [0, 1, 2, 3, 4, 5];

export const BudgetCalculator = ({ store }: BudgetCalculatorProps) => {
  const slotLabels = useMemo(() => store.timeSlots.map((slot) => slot.timeSlot), [store.timeSlots]);
  const startOptions = useMemo(() => {
    const filtered = slotLabels.filter((slot) => slot !== "24:00");
    return filtered.length > 0 ? filtered : slotLabels;
  }, [slotLabels]);

  const [params, setParams] = useState<BudgetParams>(() => defaultParams(startOptions));
  const [showTooltip, setShowTooltip] = useState(false);

  const result: BudgetBreakdown = useMemo(() => calculateBudget(store, params), [store, params]);
  const roundedTotal = useMemo(() => {
    if (result.total === 0) {
      return 0;
    }
    return Math.round(result.total / 5000) * 5000;
  }, [result.total]);
  const storePageHref = store.id ? `/stores/${store.id}` : undefined;

  const handleSelectChange = (field: NumericField) => (event: ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value);
    setParams((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStartChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setParams((prev) => ({
      ...prev,
      startTime: value,
    }));
  };

  const toggleVip = () => {
    setParams((prev) => ({ ...prev, useVipSeat: !prev.useVipSeat }));
  };

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-200">BUDGET</p>
          <h3 className="text-2xl font-semibold">2時間滞在の概算</h3>
          <p className="text-sm text-white/70">
            人数・時間を調整して予算感を掴みましょう。開始時間から連続した2時間分の料金を参照します。料金概算のため詳細は
            {storePageHref ? (
              <>
                {" "}
                <Link
                  href={storePageHref}
                  className="text-fuchsia-200 underline decoration-dotted underline-offset-4 transition hover:text-white"
                  aria-label={`${store.name} の店舗詳細ページを開く`}
                >
                  店舗ページ
                </Link>
                をご確認ください。
              </>
            ) : (
              " 店舗ページをご確認ください。"
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTooltip((prev) => !prev)}
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-fuchsia-400/60 hover:text-white"
        >
          {showTooltip ? "ロジックを隠す" : "算出ロジック"}
        </button>
      </header>

      {showTooltip && (
        <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-4 text-sm text-fuchsia-100">
          <p className="mb-2 font-semibold">計算ルール</p>
          <ul className="list-disc space-y-1 pl-5">
            {tooltipDetails.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-white/80">開始時間</span>
          <select
            value={params.startTime}
            onChange={handleStartChange}
            className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-2 focus:border-fuchsia-400/60 focus:outline-none"
          >
            {startOptions.map((slot) => (
              <option key={slot} value={slot}>
                {slot} ~ {slot === "24:00" ? "24:59" : `${slot.slice(0, 2)}:59`}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-white/80">来店人数</span>
          <select
            value={params.guestCount}
            onChange={handleSelectChange("guestCount")}
            className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-2 focus:border-fuchsia-400/60 focus:outline-none"
          >
            {guestCountOptions.map((option) => (
              <option key={option} value={option}>
                {option}名
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-white/80">指名キャスト数</span>
          <select
            value={params.nominationCount}
            onChange={handleSelectChange("nominationCount")}
            className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-2 focus:border-fuchsia-400/60 focus:outline-none"
          >
            {zeroToFiveOptions.map((option) => (
              <option key={`nomination-${option}`} value={option}>
                {option}名
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-white/80">キャストドリンク数（1人あたり）</span>
          <select
            value={params.castDrinkCountPerGuest}
            onChange={handleSelectChange("castDrinkCountPerGuest")}
            className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-2 focus:border-fuchsia-400/60 focus:outline-none"
          >
            {zeroToFiveOptions.map((option) => (
              <option key={`drink-${option}`} value={option}>
                {option}杯
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-white/80">延長回数</span>
          <select
            value={params.extensionCount}
            onChange={handleSelectChange("extensionCount")}
            className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-2 focus:border-fuchsia-400/60 focus:outline-none"
          >
            {zeroToFiveOptions.map((option) => (
              <option key={`extension-${option}`} value={option}>
                {option}回
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2 text-sm">
          <span className="font-medium text-white/80">席タイプ</span>
          <button
            type="button"
            onClick={toggleVip}
            className={`flex w-full items-center justify-center rounded-2xl border px-4 py-2 font-semibold transition ${
              params.useVipSeat
                ? "border-yellow-400/60 bg-yellow-300/20 text-yellow-100"
                : "border-white/10 bg-black/60 text-white/70 hover:border-fuchsia-400/60 hover:text-white"
            }`}
          >
            {params.useVipSeat ? "VIP料金で計算中" : "通常席で計算中"}
          </button>
          <p className="text-xs text-white/50">※VIP選択時はvipPriceを参照します。</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-purple-900/60 via-fuchsia-800/40 to-cyan-900/40 p-6 shadow-2xl shadow-purple-900/30">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">ESTIMATE</p>
        <div className="mt-2 flex items-end gap-2">
          <p className="text-4xl font-bold text-white">{formatYen(roundedTotal)}</p>
          <span className="text-sm text-white/60">（税込）</span>
        </div>
        <p className="mt-1 text-sm text-white/70">
          {params.useVipSeat ? "VIP" : "通常席"} / {params.guestCount}名 / 2時間滞在
        </p>
        <div className="mt-4 space-y-2 text-sm text-white/80">
          {result.timeSlots.map((slot) => (
            <p key={slot.label}>
              {slot.label} の席料: {formatYen(slot.pricePerPerson)} <span className="text-white/60">（1名あたり）</span>
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
        <h4 className="text-base font-semibold text-white">内訳</h4>
        <ul className="space-y-2">
          <li className="flex items-center justify-between">
            <span>時間帯料金 x 人数</span>
            <strong>{formatYen(result.guestTotal)}</strong>
          </li>
          <li className="flex items-center justify-between">
            <span>指名料 ({params.nominationCount}名)</span>
            <strong>{formatYen(result.nominationTotal)}</strong>
          </li>
          <li className="flex items-center justify-between">
            <span>キャストドリンク ({result.drinkUnitPrice.toLocaleString("ja-JP")}円 x {result.totalDrinkCount}杯)</span>
            <strong>{formatYen(result.drinkTotal)}</strong>
          </li>
          <li className="flex items-center justify-between">
            <span>延長 ({params.extensionCount}回)</span>
            <strong>{formatYen(result.extensionTotal)}</strong>
          </li>
          <li className="flex items-center justify-between text-white/70">
            <span>サービス料 ({Math.round(store.basePricing.serviceFeeRate * 100)}%)</span>
            <strong>{formatYen(result.serviceFee)}</strong>
          </li>
          <li className="flex items-center justify-between text-white/70">
            <span>消費税 ({Math.round(CONSUMPTION_TAX_RATE * 100)}%)</span>
            <strong>{formatYen(result.tax)}</strong>
          </li>
        </ul>
      </div>
    </section>
  );
};
