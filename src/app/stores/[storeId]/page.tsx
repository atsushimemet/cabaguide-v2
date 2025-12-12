import Link from "next/link";
import { notFound } from "next/navigation";

import { PageFrame } from "@/components/PageFrame";
import { getAreaById } from "@/lib/areas";
import { createBudgetTimeline } from "@/lib/budget";
import { getStoreById } from "@/lib/stores";
import { CONSUMPTION_TAX_RATE } from "@/lib/tax";

type StoreDetailPageProps = {
  params: Promise<{
    storeId: string;
  }>;
  searchParams?: Promise<{
    returnTo?: string;
    returnLabel?: string;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("ja-JP");

const formatYen = (value?: number | null) => {
  if (value == null) {
    return "未設定";
  }
  return `${currencyFormatter.format(value)}円`;
};

const formatPercent = (value?: number | null) => {
  if (value == null) {
    return "未設定";
  }
  const percent = (value * 100).toFixed(1);
  return `${percent.replace(/\.0$/, "")}%`;
};

const formatMinutesLabel = (minutes: number) => {
  const normalized = Math.max(0, Math.floor(minutes));
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const formatDisplayRange = (startLabel: string, startMinutes: number, nextStartMinutes?: number) => {
  if (typeof nextStartMinutes === "number") {
    const endMinutes = Math.max(startMinutes, nextStartMinutes - 1);
    return `${startLabel} ~ ${formatMinutesLabel(endMinutes)}`;
  }
  return `${startLabel} ~ 25:00`;
};

export default async function StoreDetailPage({ params, searchParams }: StoreDetailPageProps) {
  const { storeId } = await params;
  if (!storeId) {
    notFound();
  }

  const store = await getStoreById(storeId);

  if (!store) {
    notFound();
  }

  const area = await getAreaById(store.areaId);
  const locationLabel = area ? `${area.todofukenName} ${area.downtownName}` : `エリアID: ${store.areaId}`;

  const timeline = createBudgetTimeline(store.timeSlots);
  const searchParamsData = (await searchParams) ?? {};
  const defaultBackLink = {
    href: "/todofuken-choice",
    label: "繁華街を選び直す",
  };
  const hasCustomReturn = typeof searchParamsData.returnTo === "string" && searchParamsData.returnTo.startsWith("/");
  const backLink = {
    href: hasCustomReturn ? searchParamsData.returnTo! : defaultBackLink.href,
    label: searchParamsData.returnLabel ?? defaultBackLink.label,
  };
  const mapSearchLabel = `${store.name} ${locationLabel}`;
  const mapDetailLink =
    store.googleMapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchLabel)}`;

  return (
    <PageFrame mainClassName="gap-8">
      <Link
        href={backLink.href}
        className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
      >
        ← {backLink.label}
      </Link>

      <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_50px_rgba(5,3,18,0.65)] backdrop-blur-xl">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">STORE</p>
          <h1 className="text-3xl font-semibold">{store.name}</h1>
          <p className="text-sm text-white/70">{locationLabel}</p>
        </div>

        <div className="grid gap-4 text-sm text-white/80 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">電話番号</p>
            <a
              href={`tel:${store.phone.replace(/[^0-9+]/g, "")}`}
              className="text-lg font-semibold text-cyan-100 underline-offset-4 hover:underline"
            >
              {store.phone}
            </a>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Google Map</p>
            <a
              href={mapDetailLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-cyan-200 transition hover:text-white"
            >
              Google Mapで位置を見る ↗
            </a>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">基本価格</p>
            <p>指名料: {formatYen(store.basePricing.nominationPrice)}</p>
            <p>サービス料率: {formatPercent(store.basePricing.serviceFeeRate)}</p>
            <p>消費税: {formatPercent(CONSUMPTION_TAX_RATE)}</p>
          </div>

          {store.homepageLink && (
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">店舗HP</p>
              <Link
                href={store.homepageLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-cyan-200 transition hover:text-white"
              >
                店舗ホームページ ↗
              </Link>
            </div>
          )}
        </div>

      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">TIME SLOT</p>
          <h2 className="mt-2 text-2xl font-semibold">時間帯別料金</h2>
          <p className="text-sm text-white/70">1時間ごとの通常席（メイン）料金を参考値として掲載しています。</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {timeline.map((slot, index) => {
            const nextSlot = timeline[index + 1];
            const rangeLabel = formatDisplayRange(slot.label, slot.startMinutes, nextSlot?.startMinutes);
            return (
              <div key={slot.label} className="space-y-2 rounded-2xl border border-white/10 bg-black/60 p-4">
                <p className="text-lg font-semibold">{rangeLabel}</p>
                <div className="flex items-center justify-between text-sm text-white/80">
                  <span>通常席</span>
                  <span className="font-semibold text-white">{formatYen(slot.mainPrice)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </PageFrame>
  );
}
