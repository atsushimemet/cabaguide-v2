import Link from "next/link";

const footerLinks = [
  { label: "ホーム", href: "/" },
  { label: "これはなに？", href: "/about" },
  { label: "広告プラン", href: "#" },
  { label: "更新情報", href: "#" },
  { label: "FAQ", href: "#" },
  { label: "お問い合わせ", href: "#" },
  { label: "利用規約", href: "#" },
  { label: "障害情報", href: "#" },
];

type PageFrameProps = {
  children: React.ReactNode;
  mainClassName?: string;
};

export const PageFrame = ({ children, mainClassName }: PageFrameProps) => {
  const mainClasses = ["flex flex-col", mainClassName].filter(Boolean).join(" ");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050312] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
        <div className="absolute -top-32 left-10 h-80 w-80 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-500 blur-[140px]" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 blur-[180px]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-8 lg:py-14">
        <header className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl sm:text-left">
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              className="text-3xl font-semibold tracking-[0.3em] text-white sm:text-4xl"
            >
              cabaguide
            </Link>
            <p className="text-sm text-fuchsia-200 sm:text-base">
              「この子でよかった」を選べるネット案内所
            </p>
          </div>
        </header>

        <main className={mainClasses}>{children}</main>

        <footer className="mt-4 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">
              FOOTER
            </p>
          </div>
          <div className="mt-6 grid gap-4 text-center text-sm text-white/80 sm:grid-cols-2 lg:grid-cols-4 lg:text-left">
            {footerLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="rounded-full border border-white/10 px-4 py-2 font-medium transition hover:border-fuchsia-400/60 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
};
