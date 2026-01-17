"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { Cast } from "@/types/cast";

const DynamicTopCastCarousel = dynamic(() => import("./TopCastCarousel").then((mod) => mod.TopCastCarousel), {
  ssr: false,
});

type TopCastCarouselLazyProps = {
  casts: Cast[];
};

const SkeletonCard = () => (
  <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/60">
    <div className="relative h-48 w-full overflow-hidden rounded-xl bg-white/5">
      <div className="absolute inset-0 animate-pulse bg-white/10" />
    </div>
    <div className="space-y-2">
      <div className="h-4 w-1/2 animate-pulse bg-white/20" />
      <div className="h-3 w-2/3 animate-pulse bg-white/15" />
      <div className="h-3 w-1/3 animate-pulse bg-white/15" />
    </div>
  </div>
);

const Skeleton = () => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <SkeletonCard key={`top-cast-skeleton-${index}`} />
    ))}
  </div>
);

export function TopCastCarouselLazy({ casts }: TopCastCarouselLazyProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldRender) return;
    const node = containerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [shouldRender]);

  return (
    <div ref={containerRef}>
      {shouldRender ? <DynamicTopCastCarousel casts={casts} /> : <Skeleton />}
    </div>
  );
}
