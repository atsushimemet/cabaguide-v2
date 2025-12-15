import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdBanner } from "@/components/AdBanner";
import { CastCard } from "@/components/CastCard";
import { PageFrame } from "@/components/PageFrame";
import { getAreaById } from "@/lib/areas";
import { getPaginatedCasts, PAGE_SIZE } from "@/lib/casts";

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

  const pageNumbers = Array.from({ length: totalPages }).map((_, index) => index + 1);
  const currentYear = new Date().getFullYear();

  return (
    <PageFrame mainClassName="gap-10">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
          STEP 3
        </p>
        <h1 className="mt-4 text-xl font-semibold leading-[1.4] sm:text-3xl">
          <span className="block text-base whitespace-nowrap sm:text-[1em] sm:inline">
            {`【${currentYear}年最新】${area.todofukenName} ${area.downtownName}`}
          </span>
          <span className="block text-base sm:inline sm:ml-2 sm:whitespace-nowrap sm:text-[1em]">
            キャバクラキャストランキング
          </span>
          <span className="block text-sm whitespace-nowrap sm:text-[0.75em] sm:ml-4">
            SNSフォロワー数で見る本当の人気キャスト
          </span>
          <span className="mt-1 block text-xs text-white/60">
            広告費によるランキングではなく、Instagram・TikTokの総フォロワー数に基づいたランキングです。
          </span>
        </h1>
      </header>

      <AdBanner
        label="繁華街プラン"
        title={`${area.todofukenName} ${area.downtownName} スポット広告`}
        description="来店候補ユーザーに、ピンポイントで訴求できます。"
        href="/ads"
      />

      <section className="space-y-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {casts.map((cast) => {
            const storeReturnParams = new URLSearchParams({
              returnTo: `/casts/${downtownId}?page=${currentPage}`,
              returnLabel: `${area.todofukenName} ${area.downtownName} のキャスト一覧に戻る`,
            });
            return (
              <CastCard
                key={cast.id}
                cast={cast}
                detailHref={`${cast.castLink}?from=list&page=${currentPage}`}
                storeHref={`${cast.storeLink}?${storeReturnParams.toString()}`}
              />
            );
          })}
        </div>

        <nav className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
          <div>
            ページ {currentPage}/{totalPages} ・ 表示 {casts.length} 件 / 全 {totalCount} 件
          </div>
          <div className="flex flex-wrap gap-2">
            {pageNumbers.map((pageNumber) => (
              <Link
                key={pageNumber}
                href={`/casts/${downtownId}?page=${pageNumber}`}
                className={`rounded-full px-4 py-2 font-semibold transition ${
                  pageNumber === currentPage
                    ? "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white"
                    : "border border-white/15 text-white/70 hover:border-fuchsia-400/60 hover:text-white"
                }`}
              >
                {pageNumber}
              </Link>
            ))}
          </div>
        </nav>
      </section>

      <div className="flex flex-wrap gap-4 text-sm text-white/70">
        <Link
          href={`/downtown-choice?prefecture=${encodeURIComponent(area.todofukenName)}`}
          className="rounded-full border border-white/10 px-4 py-2 transition hover:border-fuchsia-400/60 hover:text-white"
        >
          繁華街選択に戻る
        </Link>
        <Link
          href="/todofuken-choice"
          className="rounded-full border border-white/10 px-4 py-2 transition hover:border-fuchsia-400/60 hover:text-white"
        >
          都道府県選択に戻る
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/10 px-4 py-2 transition hover:border-fuchsia-400/60 hover:text-white"
        >
          トップページに戻る
        </Link>
      </div>
    </PageFrame>
  );
}
