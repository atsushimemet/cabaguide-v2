import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { SVGProps } from "react";

import { BudgetCalculator } from "@/components/BudgetCalculator";
import { PageFrame } from "@/components/PageFrame";
import { getAreaById } from "@/lib/areas";
import { getCastDetail, getLatestFollowers } from "@/lib/cast-detail";

type CastDetailPageProps = {
  params: Promise<{
    downtownId: string;
    castId: string;
  }>;
  searchParams: Promise<{
    from?: string;
    page?: string;
  }>;
};

const numberFormatter = new Intl.NumberFormat("ja-JP");

const formatFollowers = (value: number) => `${numberFormatter.format(value)}人`;

const InstagramIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <circle cx="17" cy="7" r="1.4" fill="currentColor" />
  </svg>
);

const TikTokIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M14 4.5c.4 2 1.8 3.2 3.8 3.3v3.1a8 8 0 0 1-3.8-1.2v6c0 2.8-2.3 5.1-5.1 5.1S4 18.5 4 15.7s2.3-5.1 5.1-5.1c.3 0 .6 0 .9.1v3.1c-.3-.1-.6-.1-.9-.1-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2V4.5z"
      fill="currentColor"
    />
  </svg>
);

export default async function CastDetailPage({ params, searchParams }: CastDetailPageProps) {
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

  const searchParamsData = (await searchParams) ?? {};

  const detail = await getCastDetail(downtownId, castId);

  if (!detail) {
    notFound();
  }

  const followers = getLatestFollowers(detail.followerSnapshots);
  const instagramFollowers = followers.instagram?.followers ?? 0;
  const tiktokFollowers = followers.tiktok?.followers ?? 0;
  const totalFollowers = instagramFollowers + tiktokFollowers;
  const instagramUrl = detail.sns.find((sns) => sns.platform === "instagram")?.url;
  const tiktokUrl = detail.sns.find((sns) => sns.platform === "tiktok")?.url;

  const source = searchParamsData.from;
  const pageFromList = Number(searchParamsData.page ?? "");
  const hasValidPage = Number.isFinite(pageFromList) && pageFromList > 0;

  const defaultBackLink = {
    href: `/casts/${downtownId}`,
    label: `${area.todofukenName} ${area.downtownName} のキャスト一覧に戻る`,
  };

  const backLink =
    source === "home"
      ? { href: "/", label: "トップページに戻る" }
      : source === "list"
        ? {
            href: hasValidPage ? `/casts/${downtownId}?page=${pageFromList}` : `/casts/${downtownId}`,
            label: `${area.todofukenName} ${area.downtownName} のキャスト一覧に戻る`,
          }
        : defaultBackLink;

  return (
    <PageFrame mainClassName="gap-8">
      <Link
        href={backLink.href}
        className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
      >
        ← {backLink.label}
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
              {instagramUrl ? (
                <Link
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-white/60 transition hover:text-white"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
              ) : (
                <div className="text-white/60" aria-label="Instagram">
                  <InstagramIcon className="h-5 w-5" aria-hidden="true" />
                </div>
              )}
              <p className="text-2xl font-semibold">{formatFollowers(instagramFollowers)}</p>
            </div>
            <div>
              {tiktokUrl ? (
                <Link
                  href={tiktokUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-white/60 transition hover:text-white"
                  aria-label="TikTok"
                >
                  <TikTokIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
              ) : (
                <div className="text-white/60" aria-label="TikTok">
                  <TikTokIcon className="h-5 w-5" aria-hidden="true" />
                </div>
              )}
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
              <Link
                href={`/stores/${detail.store.id}`}
                className="text-lg font-semibold transition hover:text-white"
                aria-label={`${detail.store.name} の店舗ページを開く`}
              >
                {detail.store.name}
              </Link>
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
          </div>
        </section>

        <BudgetCalculator store={detail.store} />
      </div>
    </PageFrame>
  );
}
