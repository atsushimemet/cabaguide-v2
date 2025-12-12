import Link from "next/link";
import { redirect } from "next/navigation";

import { PageFrame } from "@/components/PageFrame";
import { findDowntownsByPrefecture } from "@/lib/areas";

export const dynamic = "force-dynamic";

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

  const downtowns = await findDowntownsByPrefecture(prefecture);

  if (downtowns.length === 0) {
    redirect("/todofuken-choice");
  }

  return (
    <PageFrame mainClassName="gap-10">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
          STEP 2
        </p>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
          {prefecture} の繁華街を選択
        </h1>
        <p className="mt-2 text-sm text-white/80">繁華街を選んでください。</p>
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
    </PageFrame>
  );
}
