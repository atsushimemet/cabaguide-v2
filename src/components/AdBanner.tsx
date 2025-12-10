import Link from "next/link";

type AdBannerProps = {
  label: string;
  title: string;
  description: string;
  href: string;
  ctaLabel?: string;
  className?: string;
};

const baseClasses =
  "rounded-3xl border border-white/10 bg-gradient-to-r from-purple-800/80 via-fuchsia-700/60 to-blue-700/70 p-6 text-center shadow-[0_0_45px_rgba(147,51,234,0.45)] backdrop-blur-xl lg:flex lg:items-center lg:justify-between lg:text-left";

export const AdBanner = ({
  label,
  title,
  description,
  href,
  ctaLabel = "広告掲載について",
  className,
}: AdBannerProps) => {
  const sectionClass = [baseClasses, className].filter(Boolean).join(" ");

  return (
    <section className={sectionClass}>
      <div className="flex-1 space-y-3">
        <p className="text-xs font-semibold tracking-[0.3em] text-white/70">{label}</p>
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/80">{description}</p>
      </div>
      <Link
        href={href}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-white/20 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:bg-white/30 lg:mt-0"
      >
        {ctaLabel}
      </Link>
    </section>
  );
};
