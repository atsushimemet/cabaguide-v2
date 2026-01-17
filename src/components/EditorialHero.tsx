import type { CSSProperties } from "react";

import styles from "./EditorialHero.module.css";

type ParticleConfig = {
  width: number;
  height: number;
  left: string;
  top: string;
  deltaX: number;
  deltaY: number;
  duration: number;
  delay: number;
  color: string;
};

const PARTICLE_COUNT = 18;

const createSeededRandom = () => {
  let seed = 42;
  return () => {
    const value = Math.sin(seed++) * 10000;
    return value - Math.floor(value);
  };
};

const createParticleConfigs = (): ParticleConfig[] => {
  const random = createSeededRandom();
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const size = 2 + random() * 4;
    return {
      width: size,
      height: size,
      left: `${random() * 100}%`,
      top: `${random() * 100}%`,
      deltaX: random() * 16 - 8,
      deltaY: random() * 26 - 10,
      duration: 4 + random() * 2,
      delay: random() * 2,
      color: index % 2 === 0 ? "#f472b6" : "#67e8f9",
    };
  });
};

const PARTICLES = createParticleConfigs();

export function EditorialHero() {
  return (
    <section className="relative -mt-10 mb-0 flex min-h-[85vh] items-end overflow-hidden pb-16 sm:-mt-12">
      <div className={`${styles.heroBackground} absolute inset-0 pointer-events-none`}>
        <div className={styles.heroScanlines} />
        {PARTICLES.map((particle, index) => {
          const particleStyle: CSSProperties & {
            [key: string]: string | number | undefined;
          } = {
            left: particle.left,
            top: particle.top,
            width: particle.width,
            height: particle.height,
            background: particle.color,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          };
          particleStyle["--particle-dx"] = `${particle.deltaX}px`;
          particleStyle["--particle-dy"] = `${particle.deltaY}px`;

          return <span key={`particle-${index}`} className={styles.heroParticle} style={particleStyle} />;
        })}
        {Array.from({ length: 3 }).map((_, index) => (
          <span
            key={`ring-${index}`}
            className={styles.heroRing}
            style={{
              width: 360 + index * 220,
              height: 360 + index * 220,
              animationDelay: `${index * 0.6}s`,
            }}
          />
        ))}
        <span
          className={styles.heroGradientDot}
          style={{
            right: "5%",
            top: "5%",
            background: "rgba(244, 114, 182, 0.4)",
          }}
        />
        <span
          className={styles.heroGradientDot}
          style={{
            left: "5%",
            bottom: "5%",
            background: "rgba(103, 232, 249, 0.35)",
            animationDelay: "1.2s",
          }}
        />
      </div>

      <div className={styles.heroWatermark} aria-hidden>
        <span className={styles.heroWatermarkLayer}>CABA</span>
        <span className={`${styles.heroWatermarkLayer} ${styles.heroWatermarkOutline}`}>CABA</span>
      </div>

      <div className={styles.heroContent}>
        <p className={styles.heroStepLabel}>STEP 3</p>
        <h2 className={styles.heroTitle}>
          GUIDE
          <span className={styles.heroTitleAccent} aria-hidden />
        </h2>
        <p className={styles.heroTagline}>「この子でよかった」と思える夜へ</p>
      </div>
    </section>
  );
}
