import { CopyButton } from "@/components/CopyButton";
import { PageFrame } from "@/components/PageFrame";

const mailAddress = "noap3b69n@gmail.com";
const mailTemplate = `件名: cabaguide お問い合わせ

宛先: ${mailAddress}

本文:
お問い合わせ種別: （例：広告掲載 / 取材依頼 / その他）
企業名・店舗名・アカウント名など: 
担当者名: 
電話番号: 
連絡希望手段（メール / 電話 / DM など）:
お問い合わせ内容:

※企業・店舗ではない個人様も問い合わせ可能です。必要であれば資料や画像をメールに添付してください。
`;

const supportTips = [
  {
    title: "一次応答",
    detail:
      "ベストエフォートで対応いたします。",
  },
  {
    title: "対応範囲",
    detail:
      "広告プランのご相談、掲載中トラブル、取材・パートナーシップ等を受け付けています。",
  },
  {
    title: "必要情報",
    detail:
      "お問い合わせ種別と概要の記載、必要に応じてスクリーンショットが添付されていると、よりスムーズに対応できます。",
  },
];

export default function InqueryPage() {
  return (
    <PageFrame mainClassName="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-fuchsia-200">
          CONTACT
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">お問い合わせ</h1>
        <p className="mt-4 text-sm text-white/80">
          メールでお問い合わせを受け付けています。下記テンプレートのコピーし、ご連絡よろしくお願いいたします。
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
              MAIL
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">メールで問い合わせる</h2>
            <p className="mt-2 text-sm text-white/80">
              {mailAddress} へテンプレートを貼り付けたメールをお送りください。
            </p>
          </div>
          <CopyButton text={mailTemplate} className="self-start" />
        </div>
        <textarea
          readOnly
          value={mailTemplate}
          className="mt-4 w-full rounded-2xl border border-white/15 bg-[#0b0b18] p-4 font-mono text-xs text-white focus:outline-none"
          rows={12}
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
          SUPPORT
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">対応ポリシー</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {supportTips.map((tip) => (
            <article
              key={tip.title}
              className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80"
            >
              <p className="text-sm font-semibold text-white">{tip.title}</p>
              <p className="mt-2 leading-relaxed">{tip.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}
