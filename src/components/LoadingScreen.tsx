"use client";

import { PropsWithChildren, useEffect, useState } from "react";

type LoadingScreenProps = PropsWithChildren<{
  durationMs?: number;
}>;

export const LoadingScreen = ({ children, durationMs = 3000 }: LoadingScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isZooming, setIsZooming] = useState(false);

  useEffect(() => {
    const zoomThreshold = Math.max(0, durationMs - 1100);
    const zoomTimer = window.setTimeout(() => setIsZooming(true), zoomThreshold);
    const hideTimer = window.setTimeout(() => setIsVisible(false), durationMs);

    return () => {
      window.clearTimeout(zoomTimer);
      window.clearTimeout(hideTimer);
    };
  }, [durationMs]);

  return (
    <>
      {children}
      {isVisible && (
        <div className="loading-screen" role="status" aria-live="polite">
          <div className={`loading-screen__logo ${isZooming ? "loading-screen__logo--zoom" : ""}`}>
            <span className="loading-screen__base">cabaguide</span>
            <span aria-hidden className="loading-screen__layer loading-screen__layer--pink">
              cabaguide
            </span>
            <span aria-hidden className="loading-screen__layer loading-screen__layer--blue">
              cabaguide
            </span>
            <span aria-hidden className="loading-screen__scan">cabaguide</span>
          </div>
        </div>
      )}
    </>
  );
};
