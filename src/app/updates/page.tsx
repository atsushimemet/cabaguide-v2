import type { ReactNode } from "react";

import { PageFrame } from "@/components/PageFrame";
import { getServiceSupabaseClient, SupabaseServiceEnvError } from "@/lib/supabaseServer";

type UpdateEntry = {
  slug: string;
  title: string | null;
  body: string;
  created_at: string;
};

export default async function UpdatesPage() {
  const updates = await getUpdatesFromDatabase();

  return (
    <PageFrame mainClassName="space-y-6">
      <section className="space-y-3 border-y border-white/15 px-4 py-10 text-center lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-fuchsia-200">UPDATES</p>
        <h1 className="text-3xl font-semibold text-white">更新情報</h1>
        <p className="text-sm text-white/80">本ページではcabaguideの更新情報を掲載します。</p>
      </section>

      {updates.length === 0 ? (
        <section className="border border-dashed border-white/20 px-4 py-6 text-center text-sm text-white/70">
          最新の更新情報はまだありません。
        </section>
      ) : (
        updates.map((entry) => {
          const bodyContent = renderMarkdown(entry.body);
          const headerClassName = [
            "flex flex-col gap-2",
            bodyContent ? "border-b border-white/20 pb-4" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <article key={entry.slug} className="space-y-4 border-b border-white/15 px-4 pb-8">
              <div className={headerClassName}>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                  {formatDate(entry.created_at)}
                </p>
                {entry.title && <h2 className="text-2xl font-semibold text-white">{entry.title}</h2>}
              </div>
              {bodyContent && <div className="space-y-3 text-sm text-white/80">{bodyContent}</div>}
            </article>
          );
        })
      )}
    </PageFrame>
  );
}

async function getUpdatesFromDatabase(): Promise<UpdateEntry[]> {
  let client;
  try {
    client = getServiceSupabaseClient();
  } catch (error) {
    if (error instanceof SupabaseServiceEnvError) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    return [];
  }

  const { data, error } = await client
    .from("updates")
    .select("slug, title, body, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load updates from Supabase:", error.message);
    return [];
  }

  return data ?? [];
}

type MarkdownBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function renderMarkdown(markdown: string): ReactNode[] | null {
  if (!markdown || !markdown.trim()) {
    return null;
  }

  const blocks: MarkdownBlock[] = [];
  const lines = markdown.split(/\r?\n/);
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  const pushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      blocks.push({ type: "paragraph", text: paragraphBuffer.join(" ") });
      paragraphBuffer = [];
    }
  };

  const pushList = () => {
    if (listBuffer.length > 0) {
      blocks.push({ type: "list", items: listBuffer.slice() });
      listBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === "") {
      pushParagraph();
      pushList();
      continue;
    }

    if (line.startsWith("# ")) {
      pushParagraph();
      pushList();
      const text = line.replace(/^#\s*/, "");
      if (text) {
        blocks.push({ type: "heading", text });
      }
      continue;
    }

    if (line.startsWith("- ")) {
      pushParagraph();
      listBuffer.push(line.replace(/^-+\s*/, ""));
      continue;
    }

    paragraphBuffer.push(line);
  }

  pushParagraph();
  pushList();

  if (blocks.length === 0) {
    return null;
  }

  return blocks.map((block, index) => {
    if (block.type === "heading") {
      return (
        <h3 key={`heading-${index}`} className="text-lg font-semibold text-white">
          {block.text}
        </h3>
      );
    }

    if (block.type === "list") {
      return (
        <ul key={`list-${index}`} className="list-disc space-y-1 pl-6 text-white/80">
          {block.items.map((item, itemIndex) => (
            <li key={`list-${index}-${itemIndex}`}>{item}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`para-${index}`} className="leading-relaxed">
        {block.text}
      </p>
    );
  });
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date(date));
}
