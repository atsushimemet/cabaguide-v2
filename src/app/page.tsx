import Link from "next/link";

import { AdBanner } from "@/components/AdBanner";
import { CastCard } from "@/components/CastCard";
import { PageFrame } from "@/components/PageFrame";
import { getTopCasts } from "@/lib/casts";

type AreaSearchCTAProps = {
  sectionId?: string;
};

export default async function Home() {
  const topCasts = await getTopCasts();
  return (
    <PageFrame mainClassName="gap-12">
      <AreaSearchCTA sectionId="area-search" />

      <AdBanner
        label="広告エリア（TOP）"
        title="トッププレミアムバナー"
        description="新プランやイベントを打ち出す店舗専用のTOP枠。SNSやLINE配信と連動させた最新情報を、サイト最上部から発信して来店アクションへ直結させましょう。"
        href="/ads"
      />

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
          {topCasts.map((cast) => {
            const storeReturnParams = new URLSearchParams({
              returnTo: "/",
              returnLabel: "トップページに戻る",
            });
            return (
              <CastCard
                key={cast.id}
                cast={cast}
                detailHref={`${cast.castLink}?from=home`}
                storeHref={`${cast.storeLink}?${storeReturnParams.toString()}`}
              />
            );
          })}
        </div>
      </section>

      <AdBanner
        label="広告エリア（BOTTOM）"
        title="BOTTOMプレミアムバナー"
        description="フッター直前で一番印象に残るゾーン。フェア / クーポン、指名強化キャンペーンなど、来店直前のユーザーへ確実に届けたい情報を掲載できます。"
        href="/ads"
      />

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
