import Link from "next/link";

import { CastCard } from "@/components/CastCard";
import { PageFrame } from "@/components/PageFrame";
import { getTopCasts } from "@/lib/casts";

type AreaSearchCTAProps = {
  sectionId?: string;
};

export default async function Home() {
  const topCasts = await getTopCasts();
  return (
    <PageFrame>
      <AreaSearchCTA sectionId="area-search" />

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl lg:flex lg:items-center lg:text-left">
        <div className="flex-1 space-y-3">
          <p className="text-xs font-semibold tracking-[0.3em] text-cyan-200">
            広告エリア（TOP）
          </p>
          <h3 className="text-2xl font-semibold text-white">
            今月限定のフルカラー広告枠
          </h3>
          <p className="text-sm text-white/80">
            夜の街を彩るネオンのように、キャスト/店舗も集客の特等席へ。
            リアルタイム訴求で集客力を底上げしませんか？
          </p>
        </div>
        <button className="mt-6 inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 lg:mt-0">
          広告掲載について
        </button>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">
            TOP CAST
          </p>
          <h3 className="mt-2 text-3xl font-semibold">今週のベスト10</h3>
          <p className="text-sm text-white/70">
            キャスト画像をタップして、詳細プロフィールにアクセス。
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topCasts.map((cast) => (
            <CastCard key={cast.id} cast={cast} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-purple-800/80 via-fuchsia-700/60 to-blue-700/70 p-6 text-center shadow-[0_0_45px_rgba(147,51,234,0.45)] backdrop-blur-xl lg:flex lg:items-center lg:justify-between lg:text-left">
        <div className="max-w-xl space-y-3">
          <p className="text-xs font-semibold tracking-[0.3em] text-white/70">
            広告エリア（BOTTOM）
          </p>
          <h3 className="text-2xl font-semibold">BOTTOMプレミアムバナー</h3>
          <p className="text-sm text-white/80">
            フッター直前で一番印象に残るゾーン。フェア情報や期間限定クーポンに◎
          </p>
        </div>
        <button className="mt-6 inline-flex items-center justify-center rounded-full bg-white/20 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:bg-white/30 lg:mt-0">
          資料をダウンロード
        </button>
      </section>

      <AreaSearchCTA />
    </PageFrame>
  );
}

const AreaSearchCTA = ({ sectionId }: AreaSearchCTAProps) => {
  return (
    <section
      id={sectionId}
      className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 text-center backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between lg:text-left"
    >
      <div className="flex flex-1 flex-col gap-2">
        <h2 className="text-2xl font-semibold text-white">エリアから探す</h2>
        <p className="text-sm text-white/70">
          今夜のとっておきを北海道から九州まで一気にチェック。
        </p>
      </div>
      <Link
        href="/todofuken-choice"
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 px-8 py-3 text-base font-semibold shadow-[0_0_25px_rgba(236,72,153,0.45)] transition hover:scale-105 lg:self-start"
      >
        エリアから探す
      </Link>
    </section>
  );
};
