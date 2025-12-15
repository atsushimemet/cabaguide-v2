import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageFrame } from "@/components/PageFrame";
import { DEFAULT_STORE_RANKING_PREFECTURE, STORE_RANKING_PAGE_SIZE } from "@/constants/storeRanking";
import { getPrefectureList } from "@/lib/areas";
import { getStoreFollowerRankingsByPrefecture } from "@/lib/stores";

type StoreRankingPageProps = {
  params: Promise<{
    todofukenId: string;
  }>;
};

const followerFormatter = new Intl.NumberFormat("ja-JP");
const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const decodePrefectureParam = (value?: string) => {
  if (!value) {
    return "";
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const formatFollowers = (value: number) => `${followerFormatter.format(Math.max(0, value))} フォロワー`;

const formatCapturedAt = (value?: string) => {
  if (!value) {
    return "更新準備中";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "更新準備中";
  }
  return `${dateFormatter.format(parsed)} 時点`;
};

const createPrefectureLink = (prefecture: string) =>
  `/stores/prefectures/${encodeURIComponent(prefecture)}`;

const buildMetadataTitle = (prefecture: string) => {
  const year = new Date().getFullYear();
  return `【${year}年最新】${prefecture}のキャバクラ店舗ランキング｜SNSフォロワー数で見る本当の人気店舗`;
};

export async function generateMetadata({ params }: StoreRankingPageProps): Promise<Metadata> {
  const { todofukenId } = await params;
  const prefectureList = await getPrefectureList();
  const decoded = decodePrefectureParam(todofukenId);
  const prefecture = prefectureList.find((name) => name === decoded) ?? DEFAULT_STORE_RANKING_PREFECTURE;

  return {
    title: buildMetadataTitle(prefecture),
    description: `${prefecture}エリアのキャバクラを、在籍キャストのSNSフォロワー合計で順位付けした独自ランキングです。`,
  };
}

export default async function StoreRankingPage({ params }: StoreRankingPageProps) {
  const { todofukenId } = await params;
  const prefectureList = await getPrefectureList();
  const decodedPrefecture = decodePrefectureParam(todofukenId);
  const prefecture = prefectureList.find((name) => name === decodedPrefecture);

  if (!prefecture) {
    notFound();
  }

  const rankings = await getStoreFollowerRankingsByPrefecture(prefecture, STORE_RANKING_PAGE_SIZE);
  const year = new Date().getFullYear();

  return (
    <PageFrame mainClassName="gap-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_18px_50px_rgba(5,3,18,0.65)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
          STORE RANKING
        </p>
        <h1 className="mt-4 text-xl font-semibold leading-[1.4] sm:text-3xl">
          <span className="block text-base whitespace-nowrap sm:inline sm:text-[1em]">
            {`【${year}年最新】${prefecture}`}
          </span>
          <span className="block text-base sm:inline sm:ml-2 sm:text-[1em]">
            キャバクラ店舗ランキング
          </span>
          <span className="block text-sm whitespace-nowrap sm:text-[0.75em] sm:ml-4">
            SNSフォロワー数で見る本当の人気店舗
          </span>
        </h1>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">PREFECTURE</p>
          <h2 className="text-xl font-semibold">都道府県を切り替える</h2>
          <p className="text-sm text-white/70">ランキングを見たい都道府県を選んでください。</p>
        </div>
        <div className="overflow-x-auto">
          <div className="flex min-w-full gap-3">
            {prefectureList.map((pref) => {
              const active = pref === prefecture;
              return (
                <Link
                  key={pref}
                  href={createPrefectureLink(pref)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-fuchsia-400/80 bg-fuchsia-500/20 text-white"
                      : "border-white/15 text-white/70 hover:border-fuchsia-400/60 hover:text-white"
                  }`}
                >
                  {pref}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_50px_rgba(5,3,18,0.65)] backdrop-blur-xl">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">TOP STORES</p>
          <h2 className="text-2xl font-semibold">{prefecture}の人気店舗 TOP {STORE_RANKING_PAGE_SIZE}</h2>
          <p className="text-sm text-white/70">
            キャバクラの在籍キャストSNSフォロワー合計をスコア化し、フォロワー数の多い順に並べています。
          </p>
        </div>

        {rankings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-6 text-center text-white/70">
            データ収集中です。キャスト情報が追加され次第、ランキングを公開します。
          </div>
        ) : (
          <div className="space-y-4">
            {rankings.map((entry) => (
              <article
                key={entry.storeId}
                className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-5 transition hover:border-fuchsia-400/40"
              >
                <div className="flex flex-1 flex-col gap-3">
                  <div className="h-32 w-full rounded-2xl bg-gradient-to-br from-fuchsia-500/40 via-purple-500/30 to-cyan-400/30" />
                  <div>
                    <Link
                      href={{
                        pathname: `/stores/${entry.storeId}`,
                        query: {
                          returnTo: createPrefectureLink(prefecture),
                          returnLabel: `${prefecture}の店舗ランキングに戻る`,
                        },
                      }}
                      className="text-2xl font-semibold text-white underline-offset-4 hover:underline"
                    >
                      {entry.storeName}
                    </Link>
                    <p className="text-sm text-white/60">
                      {entry.todofukenName} {entry.downtownName}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 text-sm text-white/80 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">FOLLOWERS</p>
                    <p className="mt-2 text-xl font-semibold text-white">{formatFollowers(entry.followers)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">LAST UPDATE</p>
                    <p className="mt-2 text-base text-white">{formatCapturedAt(entry.capturedAt)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageFrame>
  );
}
