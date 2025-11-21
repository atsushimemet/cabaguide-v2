import Link from "next/link";

import { PageFrame } from "@/components/PageFrame";
import { groupAreasByPrefecture } from "@/lib/areas";

const prefectureGroups = groupAreasByPrefecture();

export default function TodofukenChoicePage() {
  return (
    <PageFrame mainClassName="gap-10">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
          STEP 1
        </p>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">都道府県を選択</h1>
        <p className="mt-2 text-sm text-white/80">
          cabaguideがサポートする都道府県から気になるエリアを選んでください。
        </p>
      </div>

      <section className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div className="grid gap-4 md:grid-cols-2">
          {prefectureGroups.map((group) => (
            <Link
              key={group.prefecture}
              href={{
                pathname: "/downtown-choice",
                query: { prefecture: group.prefecture },
              }}
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-fuchsia-300/60 hover:bg-white/10"
            >
              <p className="text-2xl font-semibold">{group.prefecture}</p>
              <p className="text-xs text-white/70">{group.downtowns.length} 繁華街</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="flex justify-center text-sm text-white/70">
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
