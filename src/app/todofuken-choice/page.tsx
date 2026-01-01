import Link from "next/link";

import { PageFrame } from "@/components/PageFrame";
import { groupAreasByPrefecture } from "@/lib/areas";

export const dynamic = "force-dynamic";

export default async function TodofukenChoicePage() {
  const prefectureGroups = await groupAreasByPrefecture();
  return (
    <PageFrame mainClassName="gap-10">
      <section className="space-y-3 border-y border-white/15 px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">STEP 1</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">都道府県を選択</h1>
        <p className="text-sm text-white/80">都道府県を選んでください。</p>
      </section>

      <section className="space-y-6 border-y border-white/15 px-2 py-10 sm:px-4">
        <div className="grid gap-6 md:grid-cols-2">
          {prefectureGroups.map((group) => (
            <Link
              key={group.prefecture}
              href={{
                pathname: "/downtown-choice",
                query: { prefecture: group.prefecture },
              }}
              className="flex flex-col gap-2 border-t border-white/15 px-2 py-4 text-left transition hover:border-white hover:bg-white/10"
            >
              <p className="text-2xl font-semibold">{group.prefecture}</p>
              <p className="text-xs text-white/70">{group.downtowns.length} 繁華街</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="flex justify-center border-t border-white/15 pt-6 text-sm text-white/70">
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
