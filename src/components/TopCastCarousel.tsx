"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue } from "motion/react";
import type { Transition } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, KeyboardEvent } from "react";

import { formatFollowers } from "@/components/CastCard";
import styles from "./TopCastCarousel.module.css";
import { Cast } from "@/types/cast";

type TopCastCarouselProps = {
  casts: Cast[];
};

const GAP = 24;
const SPRING_OPTIONS: Transition = { type: "spring", stiffness: 320, damping: 32 };
const AUTO_PLAY_DELAY = 5000;

type CarouselEntry = {
  cast: Cast;
  rank: number;
};

type CarouselItemProps = {
  entry: CarouselEntry;
  index: number;
  itemWidth: number;
  transition: Transition;
};

const buildDetailHref = (castLink: string) => {
  return castLink.includes("?") ? `${castLink}&from=home` : `${castLink}?from=home`;
};

const CarouselItem = ({ entry, index, itemWidth, transition }: CarouselItemProps) => {
  return (
    <motion.article
      className={styles.carouselItem}
      style={{ width: itemWidth }}
      transition={transition}
      key={`${entry.cast.id}-${index}`}
    >
      <Link href={buildDetailHref(entry.cast.castLink)} className={styles.carouselCard}>
        <div className={styles.cardMedia}>
          <Image src={entry.cast.image} alt={`${entry.cast.name}のキャスト画像`} fill sizes="360px" />
          <div className={styles.mediaOverlay} />
          <span className={styles.rankBadge}>
            #{entry.rank.toString().padStart(2, "0")}
          </span>
        </div>
        <div className={styles.cardBody}>
          <p className={styles.cardLabel}>TOP CAST</p>
          <h3 className={styles.castName}>{entry.cast.name}</h3>
          <p className={styles.storeName}>{entry.cast.storeName}</p>
          <div className={styles.followSection}>
            <span className={styles.followLabel}>FOLLOWERS</span>
            <p className={styles.followValue}>{entry.cast.followers.toLocaleString("ja-JP")}</p>
            <p className={styles.followDetail}>{formatFollowers(entry.cast.followers)}</p>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

export const TopCastCarousel = ({ casts }: TopCastCarouselProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const canNavigate = casts.length > 1;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const itemWidth = useMemo(() => {
    if (containerWidth === 0) {
      return 300;
    }
    const target = containerWidth * 0.65;
    return Math.max(260, Math.min(340, target));
  }, [containerWidth]);

  const trackOffset = itemWidth + GAP;
  const loop = casts.length > 1;

  const itemsForRender = useMemo<CarouselEntry[]>(() => {
    if (casts.length === 0) {
      return [];
    }
    if (!loop) {
      return casts.map((cast, index) => ({ cast, rank: index + 1 }));
    }
    const first = casts[0];
    const last = casts[casts.length - 1];
    return [
      { cast: last, rank: casts.length },
      ...casts.map((cast, index) => ({ cast, rank: index + 1 })),
      { cast: first, rank: 1 },
    ];
  }, [casts, loop]);

  const x = useMotionValue(0);
  const [position, setPosition] = useState(loop ? 1 : 0);
  const maxPositionIndex = Math.max(0, itemsForRender.length - 1);

  const clampPosition = useCallback(
    (value: number) => Math.max(0, Math.min(value, maxPositionIndex)),
    [maxPositionIndex]
  );

  useEffect(() => {
    const start = loop ? 1 : 0;
    const frame = window.requestAnimationFrame(() => {
      setPosition(start);
      x.set(-start * trackOffset);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loop, trackOffset, casts.length, x]);

  useEffect(() => {
    if (loop) {
      return;
    }
    const max = Math.max(0, itemsForRender.length - 1);
    if (position <= max) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setPosition(max);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [itemsForRender.length, loop, position]);

  useEffect(() => {
    if (!loop || itemsForRender.length <= 1) {
      return;
    }
    if (isHovered) {
      return;
    }
    const timer = window.setInterval(() => {
      setPosition((prev) => clampPosition(prev + 1));
    }, AUTO_PLAY_DELAY);

    return () => window.clearInterval(timer);
  }, [clampPosition, isHovered, itemsForRender.length, loop]);

  const effectiveTransition: Transition = isJumping ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationComplete = () => {
    if (!loop || itemsForRender.length <= 1) {
      setIsAnimating(false);
      return;
    }

    const lastCloneIndex = itemsForRender.length - 1;

    if (position === lastCloneIndex) {
      setIsJumping(true);
      const target = 1;
      setPosition(target);
      x.set(-target * trackOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    if (position === 0) {
      setIsJumping(true);
      const target = casts.length;
      setPosition(target);
      x.set(-target * trackOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    setIsAnimating(false);
  };

  const goToPrevious = useCallback(() => {
    setPosition((prev) => clampPosition(prev - 1));
  }, [clampPosition]);

  const goToNext = useCallback(() => {
    setPosition((prev) => clampPosition(prev + 1));
  }, [clampPosition]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!canNavigate) {
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goToNext();
    }
  };

  const isPrevDisabled = !loop && position <= 0;
  const isNextDisabled = !loop && position >= Math.max(itemsForRender.length - 1, 0);


  if (casts.length === 0) {
    return (
      <p className="border border-dashed border-white/20 px-4 py-3 text-sm text-white/70">
        今週のベスト10は表示できるキャストがいません。
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className={styles.carouselContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={canNavigate ? 0 : -1}
      role="region"
      aria-roledescription="carousel"
      aria-label="全国ベスト10"
      onKeyDown={handleKeyDown}
    >
      <div className={styles.carouselViewport}>
        <div className={styles.carouselInner}>
          <div className={styles.carouselWindow}>
            <motion.div
              className={styles.carouselTrack}
              drag={false}
              style={{ gap: `${GAP}px`, x }}
              animate={{ x: -(position * trackOffset) }}
              transition={effectiveTransition}
              onAnimationStart={() => setIsAnimating(true)}
              onAnimationComplete={handleAnimationComplete}
            >
              {itemsForRender.map((entry, index) => (
                <CarouselItem
                  key={`${entry.cast.id}-${index}`}
                  entry={entry}
                  index={index}
                  itemWidth={itemWidth}
                  transition={effectiveTransition}
                />
              ))}
            </motion.div>
          </div>
          {canNavigate && (
            <>
              <button
                type="button"
                className={`${styles.navButton} ${styles.prevButton}`}
                onClick={goToPrevious}
                aria-label="前のキャストへ"
                disabled={isPrevDisabled}
                data-testid="carousel-prev"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                className={`${styles.navButton} ${styles.nextButton}`}
                onClick={goToNext}
                aria-label="次のキャストへ"
                disabled={isNextDisabled}
                data-testid="carousel-next"
              >
                <span aria-hidden="true">›</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
