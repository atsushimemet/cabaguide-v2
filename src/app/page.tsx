import { AdBanner } from "@/components/AdBanner";
import { AreaSearchCTA } from "@/components/AreaSearchCTA";
import { PageFrame } from "@/components/PageFrame";
import { LoadingScreen } from "@/components/LoadingScreen";
import { TopCastGrid } from "@/components/TopCastGrid";
import { getTopCasts } from "@/lib/casts";
import { getRankingLastUpdatedLabel } from "@/lib/lastUpdated";
import { StructuredDataScript, buildCastRankingStructuredData } from "@/lib/structuredData";

export const dynamic = "force-dynamic";

export default async function Home() {
  const topCasts = await getTopCasts();
  const lastUpdatedLabel = await getRankingLastUpdatedLabel();
  const lastUpdatedText = `最終更新：${lastUpdatedLabel ?? "更新準備中"}`;
  const topCastStructuredData =
    topCasts.length > 0
      ? buildCastRankingStructuredData({
          name: "cabaguide 今週のベスト10",
          description: "Instagram・TikTokのフォロワー数で集計したcabaguideのキャストランキングTOP10。",
          url: "/",
          casts: topCasts,
        })
      : null;

  return (
    <LoadingScreen>
      <PageFrame mainClassName="gap-12">
        <AreaSearchCTA sectionId="area-search" />

        <AdBanner
          label="広告エリア（TOP）"
          title="トッププレミアムバナー"
          description="店舗専用TOP枠で最新情報を発信"
          href="/ads"
          animationVariant="top"
        />

        <section className="space-y-6">
          <div id="top-cast-lead">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">
              TOP CAST
            </p>
            <h3 className="mt-2 text-3xl font-semibold">今週のベスト10</h3>
            <p className="text-sm text-white/70">
              キャスト画像をタップして、詳細プロフィールにアクセス。
            </p>
            <p className="text-xs text-white/50">{lastUpdatedText}</p>
          </div>
          <TopCastGrid casts={topCasts} triggerId="top-cast-lead" />
        </section>

        <AdBanner
          label="広告エリア（BOTTOM）"
          title="BOTTOMプレミアムバナー"
          description="店舗専用BOTTOM枠で最新情報を発信"
          href="/ads"
          animationVariant="bottom"
        />

        <AreaSearchCTA />

        {topCastStructuredData && <StructuredDataScript data={topCastStructuredData} />}
      </PageFrame>
    </LoadingScreen>
  );
}
