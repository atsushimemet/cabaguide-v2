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
                {formatDate(entry.created_at)}
              </p>
              {entry.title && (
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
