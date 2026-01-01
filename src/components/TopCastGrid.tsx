'use client';

import { useEffect, useMemo, useRef, useState } from "react";

import { CastCard } from "@/components/CastCard";
import { Cast } from "@/types/cast";

type TopCastGridProps = {
  casts: Cast[];
  triggerId?: string;
};

const GLITCH_INTERVAL_MS = 220;
const MOBILE_BREAKPOINT = "(max-width: 640px)";

export const TopCastGrid = ({ casts, triggerId }: TopCastGridProps) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTriggerReady, setMobileTriggerReady] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_BREAKPOINT);
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);

    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setVisibleCount(0);
      setHasStarted(false);
      setMobileTriggerReady(false);
    }, 0);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [casts, isMobile]);

  useEffect(() => {
    if (isMobile || hasStarted) return;

    let observer: IntersectionObserver | undefined;
    let fallbackTimer: number | undefined;
    const target = gridRef.current;

    const startReveal = () => {
      setHasStarted((prev) => (prev ? prev : true));
    };

    const setupObserver = () => {
      if (!target || typeof IntersectionObserver === "undefined") {
        fallbackTimer = window.setTimeout(startReveal, 0);
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            startReveal();
            observer?.disconnect();
          }
        },
        {
          threshold: 0.2,
          rootMargin: "0px 0px -10% 0px",
        },
      );

      observer.observe(target);
    };

    setupObserver();
    const safetyTimer = window.setTimeout(startReveal, 1500);

    return () => {
      observer?.disconnect();
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
      window.clearTimeout(safetyTimer);
    };
  }, [hasStarted, isMobile]);

  useEffect(() => {
    if (isMobile) return;
    if (!hasStarted) return;
    if (visibleCount >= casts.length) return;

    const timer = window.setTimeout(() => {
      setVisibleCount((current) => Math.min(current + 1, casts.length));
    }, GLITCH_INTERVAL_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [casts.length, hasStarted, isMobile, visibleCount]);

  useEffect(() => {
    if (!isMobile) return;

    const startReveal = () => setMobileTriggerReady(true);

    if (!triggerId) {
      startReveal();
      return;
    }

    const triggerElement = document.getElementById(triggerId);
    if (!triggerElement || typeof IntersectionObserver === "undefined") {
      startReveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          startReveal();
          observer.disconnect();
        }
      },
      {
        threshold: 0.5,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observer.observe(triggerElement);

    return () => observer.disconnect();
  }, [isMobile, triggerId]);

  useEffect(() => {
    if (!isMobile || !mobileTriggerReady) return;
    const elements = itemRefs.current.filter((node): node is HTMLDivElement => Boolean(node));

    if (elements.length === 0) {
      const autoTimer = window.setTimeout(() => setVisibleCount(casts.length > 0 ? 1 : 0), 0);
      return () => window.clearTimeout(autoTimer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const indexValue = Number((entry.target as HTMLElement).dataset.index ?? -1);
          if (indexValue < 0) return;
          setVisibleCount((current) => Math.max(current, indexValue + 1));
        });
      },
      {
        threshold: 0.6,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [casts.length, isMobile, mobileTriggerReady]);

  const items = useMemo(
    () =>
      casts.map((cast, index) => {
        const isVisible = index < visibleCount;
        const wrapperClass = [
          "cast-card-glitch",
          isVisible ? "cast-card-glitch--visible neon-laser-frame" : "cast-card-glitch--hidden",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={cast.id}
            className={wrapperClass}
            aria-hidden={!isVisible}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            data-index={index}
          >
            <span className="neon-laser-gap" aria-hidden="true" />
            <span className="neon-laser-inner" aria-hidden="true" />
            <CastCard cast={cast} detailHref={`${cast.castLink}?from=home`} rank={index + 1} className="h-full" />
          </div>
        );
      }),
    [casts, visibleCount],
  );

  return (
    <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items}
    </div>
  );
};
