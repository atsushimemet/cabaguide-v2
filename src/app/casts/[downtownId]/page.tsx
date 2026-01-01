import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdBanner } from "@/components/AdBanner";
import { CastCard } from "@/components/CastCard";
import { PageFrame } from "@/components/PageFrame";
import { getAreaById } from "@/lib/areas";
import { getPaginatedCasts, PAGE_SIZE } from "@/lib/casts";
import { getRankingLastUpdatedLabel } from "@/lib/lastUpdated";
import { buildCastRankingStructuredData, StructuredDataScript } from "@/lib/structuredData";

type CastListPageParams = Promise<{
  downtownId: string;
}>;

type CastListSearchParams = Promise<{
  page?: string;
  prefecture?: string;
}>;

type CastListPageProps = {
  params: CastListPageParams;
  searchParams: CastListSearchParams;
};

const buildCastRankingTitle = (year: number, todofuken: string, downtown: string) =>
  `【${year}年最新】${todofuken} ${downtown}のキャバクラキャストランキング｜SNSフォロワー数で見る本当の人気キャスト`;

export async function generateMetadata({
  params,
}: {
  params: CastListPageParams;
}): Promise<Metadata> {
  const paramsData = await params;
  const downtownId = Number(paramsData.downtownId);

  if (Number.isNaN(downtownId)) {
    return { title: "キャストランキング" };
  }

  const area = await getAreaById(downtownId);

  if (!area) {
    return { title: "キャストランキング" };
  }

  const currentYear = new Date().getFullYear();
  return {
    title: buildCastRankingTitle(currentYear, area.todofukenName, area.downtownName),
  };
}

export default async function CastListPage({ params, searchParams }: CastListPageProps) {
  const paramsData = await params;
  const downtownId = Number(paramsData.downtownId);

  if (Number.isNaN(downtownId)) {
    notFound();
  }

  const area = await getAreaById(downtownId);

  if (!area) {
    notFound();
  }

  const searchParamsData = await searchParams;
  const requestedPage = Number(searchParamsData.page ?? "1");
  const { casts, totalCount, totalPages, currentPage } = await getPaginatedCasts(
    downtownId,
    requestedPage,
    PAGE_SIZE
  );
  const lastUpdatedLabel = await getRankingLastUpdatedLabel();
  const lastUpdatedText = `最終更新：${lastUpdatedLabel ?? "更新準備中"}`;

  const pageNumbers = Array.from({ length: totalPages }).map((_, index) => index + 1);
  const currentYear = new Date().getFullYear();
  const areaLabel = `${area.todofukenName} ${area.downtownName}`;
  const startPosition = (currentPage - 1) * PAGE_SIZE;
  const pagePath = currentPage > 1 ? `/casts/${downtownId}?page=${currentPage}` : `/casts/${downtownId}`;
  const structuredData =
    casts.length > 0
      ? buildCastRankingStructuredData({
          name: `【${currentYear}年最新】${areaLabel}のキャバクラキャストランキング`,
          description: `${areaLabel}のキャバクラキャストをSNSフォロワー数で順位付けしたcabaguide独自ランキングです。`,
          url: pagePath,
          casts,
          startPosition,
        })
      : null;

  return (
    <PageFrame mainClassName="gap-10">
      <section className="space-y-4 border-y border-white/15 px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">STEP 3</p>
        <h1 className="text-xl font-semibold leading-[1.5] sm:text-3xl">
          <span className="block text-base whitespace-nowrap sm:inline sm:text-[1em]">
            {`【${currentYear}年最新】${area.todofukenName} ${area.downtownName}`}
          </span>
          <span className="block text-base sm:ml-2 sm:inline sm:whitespace-nowrap sm:text-[1em]">
            キャバクラキャストランキング
          </span>
          <span className="block text-sm whitespace-nowrap sm:ml-4 sm:text-[0.75em]">
            SNSフォロワー数で見る本当の人気キャスト
          </span>
          <span className="mt-1 block text-xs text-white/60">
            広告費によるランキングではなく、Instagram・TikTokの総フォロワー数に基づいたランキングです。Instagram/TikTokで有名・人気キャストを見つけよう！
          </span>
        </h1>
      </section>

      <AdBanner
        label="繁華街プラン"
        title={`${area.todofukenName} ${area.downtownName} スポット広告`}
        description="来店候補ユーザーに、ピンポイントで訴求できます。"
        href="/ads"
      />

      <section className="space-y-6 border-y border-white/15 px-2 py-10 sm:px-4">
        <div className="space-y-1 text-sm text-white/70">
          <p>キャスト画像をタップして、詳細プロフィールにアクセス。</p>
          <p className="text-xs text-white/50">{lastUpdatedText}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {casts.map((cast, index) => {
            const globalRank = (currentPage - 1) * PAGE_SIZE + (index + 1);
            return (
              <CastCard
                key={cast.id}
                cast={cast}
                detailHref={`${cast.castLink}?from=list&page=${currentPage}`}
                rank={globalRank}
              />
            );
          })}
        </div>

        <nav className="flex flex-wrap items-center justify-between gap-4 border-y border-white/15 py-6 text-sm text-white/80">
          <div>
            ページ {currentPage}/{totalPages} ・ 表示 {casts.length} 件 / 全 {totalCount} 件
          </div>
          <div className="flex flex-wrap gap-2">
            {pageNumbers.map((pageNumber) => (
              <Link
                key={pageNumber}
                href={`/casts/${downtownId}?page=${pageNumber}`}
                className={`border-b px-2 pb-1 text-sm font-semibold transition ${
                  pageNumber === currentPage
                    ? "border-white text-white"
                    : "border-white/30 text-white/70 hover:border-fuchsia-400/60 hover:text-white"
                }`}
              >
                {pageNumber}
              </Link>
            ))}
          </div>
        </nav>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-white/15 pt-6 text-sm text-white/70">
        <Link
          href={`/downtown-choice?prefecture=${encodeURIComponent(area.todofukenName)}`}
          className="border-b border-white/30 px-2 pb-1 transition hover:border-fuchsia-400/60 hover:text-white"
        >
          繁華街選択に戻る
        </Link>
        <Link
          href="/todofuken-choice"
          className="border-b border-white/30 px-2 pb-1 transition hover:border-fuchsia-400/60 hover:text-white"
        >
          都道府県選択に戻る
        </Link>
        <Link
          href="/"
          className="border-b border-white/30 px-2 pb-1 transition hover:border-fuchsia-400/60 hover:text-white"
        >
          トップページに戻る
        </Link>
      </div>

      {structuredData && <StructuredDataScript data={structuredData} />}
    </PageFrame>
  );
}
