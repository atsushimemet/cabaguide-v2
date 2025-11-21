import Link from "next/link";
import { notFound } from "next/navigation";

import { CastCard } from "@/components/CastCard";
import { PageFrame } from "@/components/PageFrame";
import { getAreaById } from "@/lib/areas";
import { getPaginatedCasts, PAGE_SIZE } from "@/lib/casts";

type CastListPageProps = {
  params: Promise<{
    downtownId: string;
  }>;
  searchParams: Promise<{
    page?: string;
    prefecture?: string;
  }>;
};

export default async function CastListPage({ params, searchParams }: CastListPageProps) {
  const paramsData = await params;
  const downtownId = Number(paramsData.downtownId);

  if (Number.isNaN(downtownId)) {
    notFound();
  }

  const area = getAreaById(downtownId);

  if (!area) {
    notFound();
  }

  const searchParamsData = await searchParams;
  const requestedPage = Number(searchParamsData.page ?? "1");
  const { casts, totalCount, totalPages, currentPage } = getPaginatedCasts(
    downtownId,
    requestedPage,
    PAGE_SIZE
  );

  const pageNumbers = Array.from({ length: totalPages }).map((_, index) => index + 1);

  return (
    <PageFrame mainClassName="gap-10">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
          STEP 3
        </p>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
          {area.todofukenName} {area.downtownName} のキャスト
        </h1>
        <p className="mt-3 text-sm text-white/80">
          合計 {totalCount} 名のキャストが登録されています。ページネーションで気になるキャストをチェックしましょう。
        </p>
      </header>

      <section className="space-y-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {casts.map((cast) => (
            <CastCard key={cast.id} cast={cast} />
          ))}
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
