import fs from "fs/promises";
import path from "path";

import { PageFrame } from "@/components/PageFrame";

type UpdateEntry = {
  slug: string;
  title: string;
  body: string;
  updatedAt: Date;
};

export default async function UpdatesPage() {
  const updates = await getUpdates();

  return (
    <PageFrame mainClassName="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-fuchsia-200">
          UPDATES
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">更新情報</h1>
        <p className="mt-4 text-sm text-white/80">
          本ページではcabaguideの更新情報を掲載します。
        </p>
      </section>

      {updates.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-white/10 bg-black/40 p-6 text-center text-sm text-white/70">
          最新の更新情報はまだありません。
        </section>
      ) : (
        updates.map((entry) => (
          <article
            key={entry.slug}
            className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-2 border-b border-white/10 pb-4">
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                {formatDate(entry.updatedAt)}
              </p>
              {entry.title && entry.title !== "更新情報" && (
                <h2 className="text-2xl font-semibold text-white">{entry.title}</h2>
              )}
            </div>
            <div className="space-y-3 text-sm text-white/80">{renderMarkdown(entry.body)}</div>
          </article>
        ))
      )}
    </PageFrame>
  );
}

async function getUpdates(): Promise<UpdateEntry[]> {
  const updatesDir = path.join(process.cwd(), "docs", "updates");
  let files: string[];
  try {
    files = await fs.readdir(updatesDir);
  } catch {
    return [];
  }

  const markdownFiles = files.filter((file) => file.endsWith(".md"));

  const entries = await Promise.all(
    markdownFiles.map(async (fileName) => {
      const filePath = path.join(updatesDir, fileName);
      const [rawContent, stats] = await Promise.all([fs.readFile(filePath, "utf-8"), fs.stat(filePath)]);
      const { title, body } = extractTitleAndBody(rawContent);

      return {
        slug: fileName.replace(/\.md$/, ""),
        title,
        body,
        updatedAt: stats.mtime,
      };
    })
  );

  return entries.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

function extractTitleAndBody(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  let title = "更新情報";
  const bodyLines: string[] = [];
  let titleCaptured = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!titleCaptured && trimmed.startsWith("# ")) {
      title = trimmed.replace(/^#\s*/, "").trim() || title;
      titleCaptured = true;
      continue;
    }
    bodyLines.push(line);
  }

  return {
    title,
    body: bodyLines.join("\n").trim(),
  };
}

type MarkdownBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function renderMarkdown(markdown: string) {
  if (!markdown) {
    return (
      <p className="text-white/60" key="empty">
        詳細な説明はありません。
      </p>
    );
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(date);
}
