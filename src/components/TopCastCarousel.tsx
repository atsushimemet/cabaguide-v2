"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CastCard } from "@/components/CastCard";
import { Cast } from "@/types/cast";

type TopCastCarouselProps = {
  casts: Cast[];
};

const SCROLL_EPSILON = 2;
const AUTO_PLAY_INTERVAL = 5000;

export const TopCastCarousel = ({ casts }: TopCastCarouselProps) => {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(casts.length > 1);

  const slides = useMemo(
    () =>
      casts.map((cast, index) => (
        <div
          key={cast.id}
          className="w-[85vw] flex-shrink-0 snap-center sm:w-[360px] lg:w-[380px]"
        >
          <CastCard cast={cast} detailHref={`${cast.castLink}?from=home`} rank={index + 1} className="h-full" />
        </div>
      )),
    [casts],
  );

  const updateScrollState = useCallback(() => {
    const container = sliderRef.current;
    if (!container) {
      return;
    }

    const { scrollLeft, clientWidth, scrollWidth } = container;
    setCanScrollPrev(scrollLeft > SCROLL_EPSILON);
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - SCROLL_EPSILON);

    const midpoint = scrollLeft + clientWidth / 2;
    const childNodes = Array.from(container.children) as HTMLElement[];
    if (childNodes.length === 0) {
      setActiveIndex(0);
      return;
    }

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    childNodes.forEach((child, index) => {
      const center = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(center - midpoint);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    setActiveIndex(closestIndex);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const container = sliderRef.current;
    if (!container) {
      return;
    }
    const childNodes = Array.from(container.children) as HTMLElement[];
    if (childNodes.length === 0) {
      return;
    }

    const length = childNodes.length;
    const normalizedIndex = ((index % length) + length) % length;
    const target = childNodes[normalizedIndex];
    container.scrollTo({
      left: target.offsetLeft,
      behavior: "smooth",
    });
  }, []);

  const handlePrev = useCallback(() => {
    scrollToIndex(activeIndex - 1);
  }, [activeIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    scrollToIndex(activeIndex + 1);
  }, [activeIndex, scrollToIndex]);

  useEffect(() => {
    const container = sliderRef.current;
    if (!container) {
      return;
    }

    updateScrollState();
    const handleScroll = () => updateScrollState();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [updateScrollState]);

  useEffect(() => {
    const container = sliderRef.current;
    if (container) {
      container.scrollTo({ left: 0 });
    }
    updateScrollState();
  }, [casts, updateScrollState]);

  useEffect(() => {
    if (casts.length <= 1) {
      return;
    }
    const intervalId = window.setInterval(() => {
      scrollToIndex(activeIndex + 1);
    }, AUTO_PLAY_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeIndex, casts.length, scrollToIndex]);

  if (casts.length === 0) {
    return (
      <p className="border border-dashed border-white/20 px-4 py-3 text-sm text-white/70">
        今週のベスト10は表示できるキャストがいません。
      </p>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <div
          ref={sliderRef}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 pt-2"
          style={{ scrollBehavior: "smooth" }}
        >
          {slides}
        </div>

        <div className="pointer-events-none absolute inset-y-2 left-0 w-10 bg-gradient-to-r from-[#050312] to-transparent" />
        <div className="pointer-events-none absolute inset-y-2 right-0 w-10 bg-gradient-to-l from-[#050312] to-transparent" />

        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canScrollPrev}
            className="pointer-events-auto hidden h-12 w-12 -translate-x-4 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white transition hover:bg-black/50 disabled:pointer-events-none disabled:opacity-30 sm:flex"
            aria-label="前のキャストを見る"
          >
            ←
          </button>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
          <button
            type="button"
            onClick={handleNext}
            disabled={!canScrollNext}
            className="pointer-events-auto hidden h-12 w-12 translate-x-4 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white transition hover:bg-black/50 disabled:pointer-events-none disabled:opacity-30 sm:flex"
            aria-label="次のキャストを見る"
          >
            →
          </button>
        </div>
      </div>

    </div>
  );
};
