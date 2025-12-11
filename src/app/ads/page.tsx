import { CopyButton } from "@/components/CopyButton";
import { PageFrame } from "@/components/PageFrame";

const adPlans = [
  {
    name: "トッププラン",
    price: "¥150,000 / 月",
    description:
      "トップページのヒーローセクション直下を丸ごと占有し、キャンペーンや料金プランをサイト最上部から一斉訴求できます。",
    reach: "サイト全体",
    slot: "1枠",
  },
  {
    name: "ボトムプラン",
    price: "¥100,000 / 月",
    description:
      "トップページ最下部のBOTTOM枠に掲出され、離脱直前のユーザーへクーポンや同伴フェアなど即効性の訴求が行えます。",
    reach: "サイト全体（離脱直前）",
    slot: "1枠",
  },
  {
    name: "繁華街プラン",
    price: "¥80,000 / 月",
    description:
      "各エリアのランキングページに常設される広告カードで、エリア限定キャンペーンや来店特典を意思決定直前のユーザーへ届けられます。",
    reach: "指定エリア",
    slot: "エリアあたり1枠",
  },
];

const mailAddress = "noap3b69n@gmail.com";
const mailSubject = encodeURIComponent("cabaguide広告掲載の相談");
const mailBody = encodeURIComponent(
  [
    "以下テンプレート（店舗名など）を編集の上、ご送信ください。",
    "",
    "【店舗名】",
    "【担当者名】",
    "【電話番号】",
    "【希望プラン】トップ / ボトム / 繁華街",
    "【希望エリア（繁華街プランの場合のみ）】",
    "【クリエイティブ添付（メールに画像ファイルを添付してください）】",
    "【想定訴求内容（全角80文字以内）】",
    "【その他】",
  ].join("\n"),
);
const mailHref = `mailto:${mailAddress}?subject=${mailSubject}&body=${mailBody}`;

const mailTemplate = `件名: cabaguide広告掲載の相談

本文:
店舗名: （例：cabaguide銀座店）
担当者名: （例：山田花子）
電話番号: （例：03-1234-5678）
希望プラン: （トップ / ボトム / 繁華街）
希望エリア（繁華街プランのみ）: （例：歌舞伎町）
クリエイティブ添付: （メールに画像ファイルを添付）
想定訴求内容（全角80文字以内）: （例：SNS総フォロワー50万人超の在籍を訴求）
その他: （任意で記載）
`;

const flowSteps = [
  {
    title: "プラン選定（締切: 前月10日）",
    description: `このページのテンプレートを利用し、${mailAddress} 宛てにメールを送信してください。応募多数の場合は前月10日までの応募から抽選します。`,
    timeline: "前月1日〜10日",
  },
  {
    title: "入稿＆クリエイティブ作成（前月15日まで）",
    description:
      "採択後、メールに添付いただいた画像へテキスト（最大2行）を重ねたクリエイティブ案をcabaguideが作成します。",
    timeline: "前月11日〜15日",
  },
  {
    title: "店舗チェック（前月20日まで）",
    description: "作成したクリエイティブをメールで共有。加筆修正があればこの期間にフィードバックしてください。",
    timeline: "前月16日〜20日",
  },
  {
    title: "入金（前月25日締め）",
    description: "最終クリエイティブ確定後、月額費用を以下口座へお振り込みください。",
    extra: (
      <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs text-white/80">
        <p className="text-[10px] uppercase tracking-[0.4em] text-fuchsia-200">振込先</p>
        <p className="font-semibold text-white">GMOあおぞらネット銀行</p>
        <p>法人営業部(101) / 普通 1619609</p>
      </div>
    ),
    timeline: "前月21日〜25日",
  },
  {
    title: "掲載開始（毎月1日）",
    description:
      "全工程が完了した翌月1日から掲載を開始します。掲載期間は翌月1日 ~ 翌月末までとなります。",
    timeline: "当月1日",
  },
];

export default function AdsPage() {
  return (
    <PageFrame mainClassName="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-600/40 via-purple-800/30 to-blue-800/30 p-6 text-center backdrop-blur-xl lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
          ADS
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">cabaguide 広告プラン</h1>
        <p className="mt-4 text-sm text-white/80">
          「シンプルで運用負荷の少ない広告枠」がコンセプト。全て月額定額・成果課金なしで、メール1通とクリエイティブ入稿だけで運用が完結します。
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
            PLAN
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">料金プラン一覧</h2>
          <p className="text-sm text-white/80">
            すべてのプランは月額固定・自動更新なし。毎月リセットされるため、競合した場合はランダム抽選で掲載枠を決定します。
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {adPlans.map((plan) => (
            <div
              key={plan.name}
              className="flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-black/40 p-5"
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-200 lg:min-h-[20px]">
                  {plan.slot}
                </p>
                <h3 className="text-xl font-semibold text-white lg:min-h-[60px]">{plan.name}</h3>
              </div>
              <p className="text-2xl font-bold text-white lg:min-h-[40px]">{plan.price}</p>
              <p className="flex-1 text-sm text-white/80">{plan.description}</p>
              <div className="flex items-center rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-xs text-white/70 lg:min-h-[58px]">
                想定リーチ: {plan.reach}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
              TEMPLATE
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">メール送付テンプレート</h2>
            <p className="text-sm text-white/80">
              {mailAddress} あてにメールを送る際、以下のテンプレートをコピーして必要箇所を編集してください。
            </p>
          </div>
          <CopyButton text={mailTemplate} className="self-start" />
        </div>
        <textarea
          readOnly
          value={mailTemplate}
          className="w-full rounded-2xl border border-white/15 bg-[#0b0b18] p-4 font-mono text-xs text-white focus:outline-none"
          rows={12}
        />
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
            FLOW
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">掲載までの流れ</h2>
          <p className="mt-2 text-sm text-white/70">
            すべての工程を前月内に完了させ、翌月1日に掲載がスタートするスケジュールです。
          </p>
        </div>
        <div className="space-y-4">
          {flowSteps.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 lg:flex-row lg:items-start"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-black/40 text-xl font-semibold text-fuchsia-200">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
                    STEP {index + 1}
                  </p>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-sm text-fuchsia-200/80">{step.timeline}</p>
                <p>{step.description}</p>
                {step.extra}
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}
