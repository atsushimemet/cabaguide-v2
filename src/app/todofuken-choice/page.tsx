import Link from "next/link";

import { groupAreasByPrefecture } from "@/lib/areas";

const prefectureGroups = groupAreasByPrefecture();

export default function TodofukenChoicePage() {
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
                href={`/downtown-choice?prefecture=${encodeURIComponent(group.prefecture)}`}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-fuchsia-300/60 hover:bg-white/10"
              >
                <span className="text-sm uppercase tracking-[0.3em] text-white/60">Prefecture</span>
                <p className="text-2xl font-semibold">{group.prefecture}</p>
                <p className="text-xs text-white/70">
                  {group.downtowns.length} 繁華街
                </p>
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
      </main>
    </div>
  );
}
