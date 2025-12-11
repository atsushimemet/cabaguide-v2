import type { ReactNode } from "react";

import { PageFrame } from "@/components/PageFrame";

type PolicySection = {
  title: string;
  body: ReactNode;
};

const policySections: PolicySection[] = [
  {
    title: "1. 本規約の適用",
    body: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          cabaguide（以下「本サービス」）は、店舗選びで失敗しない、新しい夜のスタンダード。「店舗」ではなく「人」で選ぶ、次世代のキャバクラ・マッチングプラットフォームを提供します。本規約は、本サービスを閲覧・掲載・宣伝するすべての方（一般ユーザー、店舗運営者、キャスト、代理人）に適用されます。
        </p>
        <p>本規約に同意できない場合は、本サービスの利用・掲載・広告出稿を行うことはできません。</p>
      </div>
    ),
  },
  {
    title: "2. 定義",
    body: (
      <ul className="space-y-2 text-sm leading-relaxed text-white/80">
        <li>
          <span className="font-semibold text-white">一般ユーザー</span>：本サービスを閲覧し、来店検討の参考にする個人。
        </li>
        <li>
          <span className="font-semibold text-white">店舗等掲載者</span>：店舗情報や広告枠を提供する法人・個人、ならびにその代理人。
        </li>
        <li>
          <span className="font-semibold text-white">キャスト</span>：店舗に所属し、プロフィール・SNSリンク・フォロワー数等の情報が掲載される本人または代理人。
        </li>
      </ul>
    ),
  },
  {
    title: "3. 利用者共通のルール",
    body: (
      <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-white/80">
        <li>法令、公序良俗、本規約、各ページに表示する注意書きや運用ガイドに従って本サービスを利用してください。</li>
        <li>掲載情報やレイアウトは予告なく変更される場合があります。常に最新表示を確認してください。</li>
        <li>無断転載、スクレイピング等の迷惑行為は禁止します。</li>
      </ul>
    ),
  },
  {
    title: "4. 一般ユーザーの利用条件",
    body: (
      <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-white/80">
        <li>本サービスで表示される料金表は店舗から提供された時点の参考値です。実際の案内内容や会計は各店舗の最新判断に従い、正確な料金表は必ず店舗公式サイト等でご確認ください。</li>
        <li>キャストSNSフォロワー数は任意の更新時点で取得した情報を掲載しているため、最新の数値と差異が生じる場合があります。最新フォロワー数を確認したい場合は、各キャストのSNSアカウントを直接ご確認ください。</li>
        <li>掲載内容を営利目的で再配布したり、同業サービスのデータベースとして利用することは禁止です。</li>
        <li>店舗への問い合わせや予約・契約はユーザーと店舗との直接契約です。当社は契約の当事者になりません。</li>
        <li>上記条件および本規約に同意できない場合、本サービスをご利用いただくことはできません。</li>
      </ul>
    ),
  },
  {
    title: "5. 店舗・運営者向けポリシー",
    body: (
      <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-white/80">
        <li>店舗情報（店舗名、連絡先、Google Mapリンク、指名料・サービス料・時間帯別メイン席料金などDBに登録される数値）は、店舗から提供された最新データを反映するよう努めますが、反映までのタイムラグや入力ミスにより実際と異なる場合があります。</li>
        <li>本サービスに掲載する文章・画像・数値データは、著作権者・権利者から同意を得たもの、もしくは同意を要しない素材のみを使用しています。権利関係に疑義がある場合は速やかにお問い合わせからご連絡ください。</li>
        <li>
          広告枠や{" "}
          <a href="/inquery" className="text-fuchsia-200 underline transition hover:text-white">
            お問い合わせ
          </a>{" "}
          経由で取得した見込み顧客情報は、本サービス運営に必要な範囲でのみ利用し、第三者へ提供・販売することはありません。
        </li>
      </ul>
    ),
  },
  {
    title: "6. キャスト向けポリシー",
    body: (
      <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-white/80">
        <li>キャストプロフィール（名前、所属店舗、画像、SNSリンク、フォロワー数等）は公表済み情報をもとに掲載し、無断での新規掲載は行っていません。</li>
        <li>
          掲載内容は可能な限り最新化しますが、画像差し替えやSNSアカウント変更反映まで時間を要する場合があります。誤りを見つけた場合は{" "}
          <a href="/inquery" className="text-fuchsia-200 underline transition hover:text-white">
            お問い合わせ
          </a>{" "}
          経由で修正依頼をお送りください。
        </li>
        <li>SNSリンクが無効になっている場合や掲載停止を希望される場合は、ご本人確認のうえ速やかに対応します。</li>
      </ul>
    ),
  },
  {
    title: "7. コンテンツと広告に関する事項",
    body: (
      <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-white/80">
        <li>第三者サイト（店舗公式サイト、SNS、Google Map、外部予約フォーム等）へのリンクは便宜提供に過ぎず、リンク先の内容や安全性は保証しません。</li>
        <li>広告枠の掲載位置や表示回数はデバイスや閲覧状況によって変わります。広告成果を保証するものではありません。</li>
      </ul>
    ),
  },
  {
    title: "8. 禁止事項",
    body: (
      <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-white/80">
        <li>他者になりすましての掲載申請。</li>
        <li>本サービスのサーバー・ネットワークに過度な負荷を与える行為、解析・改変・リバースエンジニアリング。</li>
        <li>その他、当社が本サービスの運営上不適切と判断する行為。</li>
      </ul>
    ),
  },
  {
    title: "9. 免責・責任制限",
    body: (
      <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-white/80">
        <li>当社は、掲載情報の正確性・最新性・合法性・適合性を保証しません。利用者自身の判断と責任で利用してください。</li>
        <li>利用者間または利用者と第三者の間で発生したトラブル・損害について、当社は故意または重過失がある場合を除き一切の責任を負いません。</li>
        <li>天災、通信障害、システム保守、法令改正その他当社の合理的支配が及ばない事由によりサービス提供を中断・終了することがあります。</li>
      </ul>
    ),
  },
  {
    title: "10. 規約の変更・お問い合わせ",
    body: (
      <div className="space-y-2 text-sm leading-relaxed text-white/80">
        <p>
          法令改正やサービス内容の変更に応じて、本規約を予告なく改定する場合があります。重要な変更は{" "}
          <a href="/updates" className="text-fuchsia-200 underline transition hover:text-white">
            更新情報
          </a>{" "}
          ページでお知らせします。
        </p>
        <p>
          本規約や掲載内容に関するご連絡は{" "}
          <a href="/inquery" className="text-fuchsia-200 underline transition hover:text-white">
            「お問い合わせ」
          </a>{" "}
          ページからお願いします。
        </p>
      </div>
    ),
  },
];

export default function PolicyPage() {
  return (
    <PageFrame mainClassName="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-fuchsia-200">
          TERMS
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">cabaguide 利用規約</h1>
        <p className="mt-4 text-sm text-white/80">
          cabaguideを安全かつ公平にご利用いただくための最低限のルールをまとめています。ユーザー・店舗・キャストそれぞれの視点で重要となる事項を確認してください。
        </p>
      </section>

      <section className="space-y-6">
        {policySections.map((section) => (
          <article
            key={section.title}
            className="space-y-3 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl"
          >
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            {section.body}
          </article>
        ))}
      </section>
    </PageFrame>
  );
}
