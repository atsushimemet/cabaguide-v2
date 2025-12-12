"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";

import {
  BudgetBreakdown,
  BudgetParams,
  BudgetStartOption,
  calculateBudget,
  createBudgetTimeline,
  getBudgetStartOptions,
} from "@/lib/budget";
import {
  CHAMPAGNE_PRICE,
  LIGHT_DRINKS_PER_GUEST,
  LIGHT_DRINK_UNIT_PRICE,
} from "@/lib/pricing";
import { CONSUMPTION_TAX_RATE } from "@/lib/tax";
import { Store } from "@/types/store";

type BudgetCalculatorProps = {
  store: Store;
  storePageHref?: string;
};

const currencyFormatter = new Intl.NumberFormat("ja-JP");

const formatYen = (value: number) =>
  `${currencyFormatter.format(Math.max(0, Math.round(value)))}円`;

const defaultParams = (options: BudgetStartOption[]): BudgetParams => {
  const startTime = options[0]?.value ?? "20:00";

  return {
    startTime,
    guestCount: 1,
  };
};

const formatStartLabel = (value: string) => {
  const [hourString, minuteString = "00"] = value.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return `${value}開始`;
  }
  const hourLabel = `${hour}時`;
  if (minute === 0) {
    return `${hourLabel}開始`;
  }
  return `${hourLabel}${minute}分開始`;
};

export const BudgetCalculator = ({ store, storePageHref }: BudgetCalculatorProps) => {
  const timeline = useMemo(
    () => createBudgetTimeline(store.timeSlots),
    [store.timeSlots]
  );
  const startOptions = useMemo(
    () => getBudgetStartOptions(timeline),
    [timeline]
  );

  const [params, setParams] = useState<BudgetParams>(() =>
    defaultParams(startOptions)
  );
  const [showDetails, setShowDetails] = useState(false);

  const result: BudgetBreakdown = useMemo(
    () => calculateBudget(store, params),
    [store, params]
  );
  const storePageHrefValue =
    storePageHref ?? (store.id ? `/stores/${store.id}` : undefined);

  const handleStartChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setParams((prev) => ({
      ...prev,
      startTime: value,
    }));
  };

  const hasStartOptions = startOptions.length > 0;

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-200">
            BUDGET
          </p>
          <h3 className="text-2xl font-semibold">2時間滞在の概算</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-fuchsia-400/60 hover:text-white"
          aria-expanded={showDetails}
        >
          {showDetails ? "前提を隠す" : "概算の前提"}
        </button>
      </header>
      <div className="space-y-4">
        {showDetails && (
          <div className="rounded-2xl border border-white/15 bg-black/50 p-4 text-sm text-white/80">
            開始時間を選ぶと選択した時間から 2 時間滞在した際の概算を表示します。通常席（メイン料金）を前提に、キャストドリンク{" "}
            {LIGHT_DRINKS_PER_GUEST} 杯（1 杯 {formatYen(LIGHT_DRINK_UNIT_PRICE)}）とシャンパン 1 本{" "}
            {formatYen(CHAMPAGNE_PRICE)} を加味したシナリオを自動算出します。料金詳細は
            {storePageHrefValue ? (
              <>
                {" "}
                <Link
                  href={storePageHrefValue}
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
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-white/80">開始時間</span>
            <select
              value={hasStartOptions ? params.startTime : ""}
              onChange={handleStartChange}
              className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-2 focus:border-fuchsia-400/60 focus:outline-none"
              disabled={!hasStartOptions}
            >
              {hasStartOptions ? (
                startOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {formatStartLabel(option.value)}
                  </option>
                ))
              ) : (
                <option value="">料金情報が登録されていません</option>
              )}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {result.scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/80"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                {scenario.label}
              </p>
              <p className="mt-1 text-white/70">{scenario.description}</p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-white">
                {formatYen(scenario.total)}
              </p>
              <p className="text-xs text-white/60">税込 / 通常席 / 1名 / 2時間</p>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center justify-between">
                <span>時間帯料金</span>
                <strong>{formatYen(scenario.guestTotal)}</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>指名料</span>
                <strong>{formatYen(scenario.nominationTotal)}</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>ドリンク ({LIGHT_DRINKS_PER_GUEST}杯)</span>
                <strong>{formatYen(scenario.drinkTotal)}</strong>
              </li>
              {scenario.extrasAmount > 0 && (
                <li className="flex items-center justify-between">
                  <span>{scenario.extrasLabel ?? "追加"}</span>
                  <strong>{formatYen(scenario.extrasAmount)}</strong>
                </li>
              )}
              <li className="flex items-center justify-between text-white/70">
                <span>
                  サービス料 (
                  {store.basePricing.serviceFeeRate != null
                    ? `${Math.round(store.basePricing.serviceFeeRate * 100)}%`
                    : "未設定"}
                  )
                </span>
                <strong>{formatYen(scenario.serviceFee)}</strong>
              </li>
              <li className="flex items-center justify-between text-white/70">
                <span>消費税 ({Math.round(CONSUMPTION_TAX_RATE * 100)}%)</span>
                <strong>{formatYen(scenario.tax)}</strong>
              </li>
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};
