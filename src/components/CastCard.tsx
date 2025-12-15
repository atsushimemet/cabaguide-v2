import Image from "next/image";
import Link from "next/link";

import { Cast } from "@/types/cast";

export const formatFollowers = (value: number) => {
  return `総フォロワー数 ${value.toLocaleString("ja-JP")}`;
};

export type CastCardProps = {
  cast: Cast;
  detailHref?: string;
  storeHref?: string;
  rank?: number;
};

export const CastCard = ({ cast, detailHref, storeHref, rank }: CastCardProps) => {
  const href = detailHref ?? cast.castLink;
  const storeLink = storeHref ?? cast.storeLink;
  const showCrown = typeof rank === "number" && rank >= 1 && rank <= 3;
  const crownBg = rank === 1 ? "bg-[#fcd34d]" : "bg-white/90";
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_12px_45px_rgba(15,6,33,0.65)] backdrop-blur-xl">
      <Link href={href} className="relative block overflow-hidden rounded-2xl">
        {showCrown && (
          <span
            className={`absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-2xl ${crownBg}`}
          >
            <span aria-hidden>👑</span>
            <span className="sr-only">{`第${rank}位`}</span>
          </span>
        )}
        <span
          className="absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-semibold text-black"
          style={{ backgroundColor: cast.accent }}
        >
          {cast.badgeText ?? `${cast.prefecture}`}
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
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">TOP CAST</p>
          <h3 className="text-2xl font-semibold leading-tight">{cast.name}</h3>
        </div>
      </Link>
      <div className="mt-4 flex flex-col gap-2 text-sm text-white/80">
        <p className="font-medium text-fuchsia-100">{formatFollowers(cast.followers)}</p>
        <Link href={storeLink} className="inline-flex items-center gap-2 text-base font-semibold text-cyan-200 transition hover:text-white">
          {cast.storeName}
          <span aria-hidden>↗</span>
        </Link>
      </div>
    </article>
  );
};
