"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";

import { BudgetBreakdown, BudgetParams, calculateBudget } from "@/lib/budget";
import {
  CHAMPAGNE_PRICE,
  LIGHT_DRINKS_PER_GUEST,
  LIGHT_DRINK_UNIT_PRICE,
} from "@/lib/pricing";
import { CONSUMPTION_TAX_RATE } from "@/lib/tax";
import { Store } from "@/types/store";

type BudgetCalculatorProps = {
  store: Store;
};

const currencyFormatter = new Intl.NumberFormat("ja-JP");

const formatYen = (value: number) =>
  `${currencyFormatter.format(Math.max(0, Math.round(value)))}円`;

const defaultParams = (timeSlots: string[]): BudgetParams => {
  const startTime = timeSlots[0] ?? "20:00";

  return {
    startTime,
    guestCount: 1,
  };
};

export const BudgetCalculator = ({ store }: BudgetCalculatorProps) => {
  const slotLabels = useMemo(
    () => store.timeSlots.map((slot) => slot.timeSlot),
    [store.timeSlots]
  );
  const startOptions = useMemo(() => {
    const filtered = slotLabels.filter((slot) => slot !== "24:00");
    return filtered.length > 0 ? filtered : slotLabels;
  }, [slotLabels]);

  const [params, setParams] = useState<BudgetParams>(() =>
    defaultParams(startOptions)
  );

  const result: BudgetBreakdown = useMemo(
    () => calculateBudget(store, params),
    [store, params]
  );
  const storePageHref = store.id ? `/stores/${store.id}` : undefined;

  const handleStartChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setParams((prev) => ({
      ...prev,
      startTime: value,
    }));
  };

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-200">
            BUDGET
          </p>
          <h3 className="text-2xl font-semibold">2時間滞在の概算</h3>
          <p className="text-sm text-white/70">
            開始時間を選ぶと 2 時間滞在の概算を表示します。通常席（メイン料金）を前提に、キャストドリンク{" "}
            {LIGHT_DRINKS_PER_GUEST} 杯（1 杯 {formatYen(LIGHT_DRINK_UNIT_PRICE)}）とシャンパン 1 本{" "}
            {formatYen(CHAMPAGNE_PRICE)} を加味したシナリオを自動算出します。VIP や特別席が必要な場合は直接店舗へご確認ください。料金詳細は
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
      </header>

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

      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-purple-900/60 via-fuchsia-800/40 to-cyan-900/40 p-6 shadow-2xl shadow-purple-900/30">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">
          TIME SLOT
        </p>
        <p className="mt-1 text-sm text-white/70">通常席 / 1名 / 2時間滞在の想定で、以下 2 時間分の料金を参照します。</p>
        <div className="mt-4 space-y-2 text-sm text-white/80">
          {result.timeSlots.map((slot) => (
            <p key={slot.label}>
              {slot.label} の席料: {formatYen(slot.pricePerPerson)}{" "}
              <span className="text-white/60"></span>
            </p>
          ))}
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
                  {Math.round(store.basePricing.serviceFeeRate * 100)}%)
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
