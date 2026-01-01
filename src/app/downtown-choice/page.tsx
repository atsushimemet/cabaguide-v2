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
      <section className="space-y-3 border-y border-white/15 px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">STEP 2</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">{prefecture} の繁華街を選択</h1>
        <p className="text-sm text-white/80">繁華街を選んでください。</p>
      </section>

      <section className="space-y-6 border-y border-white/15 px-2 py-10 sm:px-4">
        <div className="grid gap-6 sm:grid-cols-2">
          {downtowns.map((downtown) => (
            <Link
              key={downtown.id}
              href={`/casts/${downtown.id}?prefecture=${encodeURIComponent(prefecture)}`}
              className="flex flex-col gap-2 border-t border-white/15 px-2 py-4 text-left transition hover:border-white hover:bg-white/10"
            >
              <p className="text-2xl font-semibold">{downtown.downtownName}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-4 border-t border-white/15 pt-6 text-sm text-white/70">
        <Link
          href="/todofuken-choice"
          className="border-b border-white/30 px-2 pb-1 transition hover:border-fuchsia-400/60 hover:text-white"
        >
          都道府県一覧に戻る
        </Link>
        <Link
          href="/"
          className="border-b border-white/30 px-2 pb-1 transition hover:border-fuchsia-400/60 hover:text-white"
        >
          トップページに戻る
        </Link>
      </div>
    </PageFrame>
  );
}
