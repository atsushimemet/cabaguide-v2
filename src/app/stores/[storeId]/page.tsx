import Link from "next/link";
import { notFound } from "next/navigation";

import { PageFrame } from "@/components/PageFrame";
import { getAreaById } from "@/lib/areas";
import { getStoreById } from "@/lib/stores";

type StoreDetailPageProps = {
  params: Promise<{
    storeId: string;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("ja-JP");

const formatYen = (value: number) => `${currencyFormatter.format(value)}円`;

const formatPercent = (value: number) => {
  const percent = (value * 100).toFixed(1);
  return `${percent.replace(/\.0$/, "")}%`;
};

const formatTimeRange = (slot: string) => {
  const [hour] = slot.split(":").map((value) => Number(value));
  const nextHour = (hour + 1) % 24;
  return `${slot} - ${String(nextHour).padStart(2, "0")}:00`;
};

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const { storeId } = await params;
  if (!storeId) {
    notFound();
  }

  const store = await getStoreById(storeId);

  if (!store) {
    notFound();
  }

  const area = getAreaById(store.areaId);
  const locationLabel = area ? `${area.todofukenName} ${area.downtownName}` : `エリアID: ${store.areaId}`;

  return (
    <PageFrame mainClassName="gap-8">
      <Link
        href="/todofuken-choice"
        className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
      >
        ← 繁華街を選び直す
      </Link>

      <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_50px_rgba(5,3,18,0.65)] backdrop-blur-xl">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">STORE</p>
          <h1 className="text-3xl font-semibold">{store.name}</h1>
          <p className="text-sm text-white/70">{locationLabel}</p>
        </div>

        <div className="grid gap-4 text-sm text-white/80 md:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">連絡先</p>
            <p className="text-lg font-semibold text-white">{store.phone}</p>
            <Link
              href={store.googleMapLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-cyan-200 transition hover:text-white"
            >
              Google Mapで位置を見る ↗
            </Link>
          </div>

          <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">基本情報</p>
            <p>指名料: {formatYen(store.basePricing.nominationPrice)}</p>
            <p>サービス料率: {formatPercent(store.basePricing.serviceFeeRate)}</p>
            <p>税率: {formatPercent(store.basePricing.taxRate)}</p>
          </div>
        </div>

        <div className="grid gap-4 text-sm text-white/80 md:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">延長・ドリンク</p>
            <p>延長料金: {formatYen(store.basePricing.extensionPrice)}</p>
            <p>キャストドリンク: {formatYen(store.basePricing.lightDrinkPrice ?? 2000)}</p>
          </div>
          <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">シャンパン</p>
            <p>最安ボトル: {formatYen(store.basePricing.cheapestChampagnePrice)}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">TIME SLOT</p>
          <h2 className="mt-2 text-2xl font-semibold">時間帯別料金</h2>
          <p className="text-sm text-white/70">1時間ごとのメイン/VIP料金を参考値として掲載しています。</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {store.timeSlots.map((slot) => (
            <div key={slot.timeSlot} className="space-y-2 rounded-2xl border border-white/10 bg-black/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">{slot.timeSlot}</p>
              <p className="text-lg font-semibold">{formatTimeRange(slot.timeSlot)}</p>
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>メイン</span>
                <span className="font-semibold text-white">{formatYen(slot.mainPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>VIP</span>
                <span className="font-semibold text-white">{formatYen(slot.vipPrice)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}
