import { AdBanner } from "@/components/AdBanner";
import { AreaSearchCTA } from "@/components/AreaSearchCTA";
import { EditorialHero } from "@/components/EditorialHero";
import { EditorialSection } from "@/components/EditorialSection";
import { PageFrame } from "@/components/PageFrame";
import { TopCastCarousel } from "@/components/TopCastCarousel";
import { getTopCasts } from "@/lib/casts";
import { getRankingLastUpdatedLabel } from "@/lib/lastUpdated";
import { StructuredDataScript, buildCastRankingStructuredData } from "@/lib/structuredData";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [topCasts, lastUpdatedLabel] = await Promise.all([getTopCasts(), getRankingLastUpdatedLabel()]);
  const topCastStructuredData =
    topCasts.length > 0
      ? buildCastRankingStructuredData({
          name: "cabaguide 今週のベスト10",
          description: "Instagram・TikTokのフォロワー数で集計したcabaguideのキャストランキングTOP10。",
          url: "/",
          casts: topCasts,
        })
      : null;

  const spacerClass = "h-6 md:h-8";

  return (
    <PageFrame mainClassName="gap-0">
      <div className="space-y-0">
        <EditorialHero />
        <div className={spacerClass} aria-hidden />
        <AreaSearchCTA sectionId="area-search" compact />
      </div>

      <AdBanner
        label="広告エリア（TOP）"
        title="トッププレミアムバナー"
        description="店舗専用TOP枠で最新情報を発信"
        href="/ads"
        animationVariant="top"
      />

      <EditorialSection
        title="全国ベスト10"
        subtitle={`最終更新 ${lastUpdatedLabel ?? "更新準備中"}`}
        index={0}
        variant="kabukicho"
        spacing="compact"
      >
        <TopCastCarousel casts={topCasts} />
      </EditorialSection>

      <div className={spacerClass} aria-hidden />
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
  );
}
