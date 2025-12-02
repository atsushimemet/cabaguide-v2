import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BudgetCalculator } from "@/components/BudgetCalculator";
import { PageFrame } from "@/components/PageFrame";
import { getAreaById } from "@/lib/areas";
import { getCastDetail, getLatestFollowers } from "@/lib/cast-detail";

type CastDetailPageProps = {
  params: Promise<{
    downtownId: string;
    castId: string;
  }>;
};

const numberFormatter = new Intl.NumberFormat("ja-JP");

const formatFollowers = (value: number) => `${numberFormatter.format(value)}人`;

export default async function CastDetailPage({ params }: CastDetailPageProps) {
  const paramsData = await params;
  const downtownId = Number(paramsData.downtownId);
  const castId = paramsData.castId;

  if (Number.isNaN(downtownId) || !castId) {
    notFound();
  }

  const area = getAreaById(downtownId);
  if (!area) {
    notFound();
  }

  const detail = await getCastDetail(downtownId, castId);

  if (!detail) {
    notFound();
  }

  const followers = getLatestFollowers(detail.followerSnapshots);
  const instagramFollowers = followers.instagram?.followers ?? 0;
  const tiktokFollowers = followers.tiktok?.followers ?? 0;
  const totalFollowers = instagramFollowers + tiktokFollowers;

  return (
    <PageFrame mainClassName="gap-8">
      <Link
        href={`/casts/${downtownId}`}
        className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
      >
        ← {area.todofukenName} {area.downtownName} のキャスト一覧に戻る
      </Link>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_50px_rgba(5,3,18,0.65)] backdrop-blur-xl">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl">
              <Image
                src={detail.cast.image}
                alt={`${detail.cast.name}のキャスト画像`}
                width={640}
                height={820}
                className="h-80 w-full object-cover"
              />
              <span className="absolute left-4 top-4 rounded-full bg-black/70 px-4 py-1 text-xs font-semibold text-white/80">
                {detail.cast.prefecture}・{detail.cast.downtownName}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold">{detail.cast.name}</h1>
              <p className="text-sm text-white/70">所属店舗: {detail.store.name}</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Instagram</p>
              <p className="text-2xl font-semibold">{formatFollowers(instagramFollowers)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">TikTok</p>
              <p className="text-2xl font-semibold">{formatFollowers(tiktokFollowers)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">総フォロワー</p>
              <p className="text-2xl font-semibold text-fuchsia-200">{formatFollowers(totalFollowers)}</p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex flex-col gap-1 text-sm text-white/80">
              <span className="text-xs uppercase tracking-[0.3em] text-white/50">STORE</span>
              <p className="text-lg font-semibold">{detail.store.name}</p>
              <Link
                href={detail.store.googleMapLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-cyan-200 transition hover:text-white"
              >
                Google Mapで開く ↗
              </Link>
              <p>電話番号: {detail.store.phone}</p>
            </div>
            <div className="space-y-1 text-sm text-white/80">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">SNS</p>
              <div className="flex flex-wrap gap-2">
                {detail.sns.map((sns) => (
                  <Link
                    key={`${sns.castId}-${sns.platform}`}
                    href={sns.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/15 px-4 py-1 text-sm transition hover:border-fuchsia-400/60 hover:text-white"
                  >
                    {sns.platform === "instagram" ? "Instagram" : "TikTok"}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <BudgetCalculator store={detail.store} />
      </div>
    </PageFrame>
  );
}
