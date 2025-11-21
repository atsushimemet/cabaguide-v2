import Image from "next/image";
import Link from "next/link";

import { topCasts } from "@/data/topCasts";

const footerLinks = [
  "ホーム",
  "これはなに？",
  "広告プラン",
  "更新情報",
  "FAQ",
  "お問い合わせ",
  "利用規約",
  "障害情報",
];

const formatFollowers = (value: number) => {
  if (value >= 10000) {
    const formatted = (value / 10000).toFixed(1).replace(/\\.0$/, "");
    return `総フォロワー数 ${formatted}万`;
  }

  return `総フォロワー数 ${value.toLocaleString("ja-JP")}`;
};

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050312] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
        <div className="absolute -top-32 left-10 h-80 w-80 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-500 blur-[140px]" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 blur-[180px]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-8 lg:py-14">
        <header className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl sm:text-left">
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              className="text-3xl font-semibold tracking-[0.3em] text-white sm:text-4xl"
            >
              cabaguide
            </Link>
            <p className="text-sm text-fuchsia-200 sm:text-base">
              「この子でよかった」を選べるネット案内所
            </p>
          </div>
        </header>

        <main className="flex flex-col gap-12">
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
                <TopCastCard key={cast.id} cast={cast} />
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-purple-800/80 via-fuchsia-700/60 to-blue-700/70 p-6 text-center shadow-[0_0_45px_rgba(147,51,234,0.45)] backdrop-blur-xl lg:flex lg:items-center lg:justify-between lg:text-left">
            <div className="max-w-xl space-y-3">
              <p className="text-xs font-semibold tracking-[0.3em] text-white/70">
                広告エリア（BOTTOM）
              </p>
              <h3 className="text-2xl font-semibold">
                BOTTOMプレミアムバナー
              </h3>
              <p className="text-sm text-white/80">
                フッター直前で一番印象に残るゾーン。フェア情報や期間限定クーポンに◎
              </p>
            </div>
            <button className="mt-6 inline-flex items-center justify-center rounded-full bg-white/20 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:bg-white/30 lg:mt-0">
              資料をダウンロード
            </button>
          </section>

          <AreaSearchCTA />
        </main>

        <footer className="mt-4 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
              FOOTER
            </p>
            <h4 className="mt-2 text-xl font-semibold">主要導線</h4>
          </div>
          <div className="mt-6 grid gap-4 text-center text-sm text-white/80 sm:grid-cols-2 lg:grid-cols-4 lg:text-left">
            {footerLinks.map((link) => (
              <Link
                key={link}
                href="#"
                className="rounded-full border border-white/10 px-4 py-2 font-medium transition hover:border-fuchsia-400/60 hover:text-white"
              >
                {link}
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}

type TopCastCardProps = {
  cast: (typeof topCasts)[number];
};

type AreaSearchCTAProps = {
  sectionId?: string;
};

const AreaSearchCTA = ({ sectionId }: AreaSearchCTAProps) => {
  return (
    <section
      id={sectionId}
      className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-1 text-center sm:text-left">
        <h2 className="text-2xl font-semibold text-white">エリアから探す</h2>
        <p className="text-sm text-white/70">
          今夜のとっておきを北海道から九州まで一気にチェック。
        </p>
      </div>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 px-8 py-3 text-base font-semibold shadow-[0_0_25px_rgba(236,72,153,0.45)] transition hover:scale-105"
      >
        エリアから探す
      </button>
    </section>
  );
};

const TopCastCard = ({ cast }: TopCastCardProps) => {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_12px_45px_rgba(15,6,33,0.65)] backdrop-blur-xl">
      <Link href={cast.castLink} className="relative block overflow-hidden rounded-2xl">
        <span
          className="absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold text-black"
          style={{ backgroundColor: cast.accent }}
        >
          {cast.prefecture} 1位
        </span>
        <Image
          src={cast.image}
          alt={`${cast.name}のキャスト画像`}
          width={500}
          height={600}
          className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-95" />
        <div className="absolute inset-x-0 bottom-0 z-10 space-y-1 px-4 pb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">
            TOP CAST
          </p>
          <h3 className="text-2xl font-semibold leading-tight">{cast.name}</h3>
        </div>
      </Link>
      <div className="mt-4 flex flex-col gap-2 text-sm text-white/80">
        <p className="font-medium text-fuchsia-100">{formatFollowers(cast.followers)}</p>
        <Link
          href={cast.storeLink}
          className="inline-flex items-center gap-2 text-base font-semibold text-cyan-200 transition hover:text-white"
        >
          {cast.storeName}
          <span aria-hidden>↗</span>
        </Link>
      </div>
    </article>
  );
};
