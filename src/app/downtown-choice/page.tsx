import Link from "next/link";
import { redirect } from "next/navigation";

import { findDowntownsByPrefecture } from "@/lib/areas";

type DowntownChoicePageProps = {
  searchParams: Promise<{
    prefecture?: string;
  }>;
};

export default async function DowntownChoicePage({
  searchParams,
}: DowntownChoicePageProps) {
  const params = await searchParams;
  const prefecture = params.prefecture;

  if (!prefecture) {
    redirect("/todofuken-choice");
  }

  const downtowns = findDowntownsByPrefecture(prefecture);

  if (downtowns.length === 0) {
    redirect("/todofuken-choice");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050312] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
        <div className="absolute -top-32 left-10 h-80 w-80 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-500 blur-[140px]" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 blur-[180px]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black to-transparent" />
      </div>

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-8 lg:py-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
            STEP 2
          </p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            {prefecture} の繁華街を選択
          </h1>
          <p className="mt-2 text-sm text-white/80">
            選択した都道府県にある繁華街からお探しください。
          </p>
        </div>

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            {downtowns.map((downtown) => (
              <Link
                key={downtown.id}
                href={`/casts/${downtown.id}?prefecture=${encodeURIComponent(prefecture)}`}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-fuchsia-300/60 hover:bg-white/10"
              >
                <p className="text-2xl font-semibold">{downtown.downtownName}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-4 text-sm text-white/70">
          <Link
            href="/todofuken-choice"
            className="rounded-full border border-white/10 px-4 py-2 transition hover:border-fuchsia-400/60 hover:text-white"
          >
            都道府県一覧に戻る
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 transition hover:border-fuchsia-400/60 hover:text-white"
          >
            トップページに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
