import { PageFrame } from "@/components/PageFrame";

const faqs = [
  {
    question: "広告出稿はキャストでも行えますか？",
    answer: "いいえ、現在は店舗のみ広告出稿可能です。",
  },
  {
    question: "広告プランに記載の料金は税込ですか？",
    answer: "いいえ、税抜きになります。",
  },
];

export default function FAQPage() {
  return (
    <PageFrame mainClassName="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-fuchsia-200">
          FAQ
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">よくある質問</h1>
        <p className="mt-4 text-sm text-white/80">
          このページではよくある質問に回答しています。
        </p>
      </section>

      <section className="space-y-4">
        {faqs.map(({ question, answer }) => (
          <article
            key={question}
            className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl"
          >
            <h2 className="text-xl font-semibold text-white">{question}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80">{answer}</p>
          </article>
        ))}
      </section>
    </PageFrame>
  );
}
