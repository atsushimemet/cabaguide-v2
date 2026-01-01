import { PageFrame } from "@/components/PageFrame";

const aboutSections = [
  {
    title: "1. サービスコンセプト",
    body: [
      "店舗選びで失敗しない、新しい夜のスタンダード。「店舗」ではなく「人」で選ぶ、次世代のキャバクラ・マッチングプラットフォームを提供します。",
    ],
  },
  {
    title: "2. 市場の課題：夜遊びにおける構造的な「不確実性」",
    body: [
      "既存のキャバクラ関連Webサービスや案内所における最大の欠点は、情報の主体が「店舗」に限定されていることです。ユーザーは来店する店舗を選ぶことしかできず、その店にどのような女性が在籍しているかという最も重要な情報は、実際に暖簾をくぐるまでブラックボックスの状態です。",
      "その結果、決して安くはない料金を支払って来店したにもかかわらず、好みのキャストに巡り会えずに退店するというミスマッチが頻発しています。ユーザーにとって「キャバクラに行くこと」は、当たり外れの大きいギャンブルのような体験になってしまっているのが現状です。",
    ],
  },
  {
    title: "3. ソリューション：エリア別SNSフォロワーランキングによる「指名」のDX",
    body: [
      "私たちはこの課題に対し、業界初となるキャスト掲載型のWebサービスで解決策を提示します。本サービスは、店舗リストではなく「キャスト名鑑」をメインコンテンツとし、ユーザーに「店選び」から「キャスト選び」へのパラダイムシフトをもたらします。",
      "具体的には、各エリアのキャストをSNSフォロワーランキング順に一覧表示します。ユーザーはインフルエンサー的な影響力や人気度、そしてSNSを通じたリアルな姿を基準にキャストを探すことができます。さらに、気になったキャストがいれば、その場で「インスタ指名」が可能な導線を設計しています。",
    ],
  },
  {
    title: "4. 提供価値：来店前の「確約」と「失敗ゼロ」の実現",
    body: [
      "このサービスを利用することで、ユーザー体験は劇的に変化します。事前に好みの女性をSNSレベルで確認し、指名を確約した状態で来店することが可能になるため、従来のような「行ってみないと分からない」というリスクは完全に排除されます。",
      "ユーザーは「キャバクラに行って失敗した」というネガティブな経験から解放され、確実な満足を得ることができます。私たちは、ナイトレジャー市場における情報の非対称性を解消し、ユーザーとキャストの双方にとって最適なマッチングを実現するインフラを構築します。",
    ],
  },
];

export default function AboutPage() {
  return (
    <PageFrame mainClassName="space-y-8">
      <section className="space-y-3 border-y border-white/15 px-4 py-10 text-center lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-fuchsia-200">ABOUT</p>
        <h1 className="text-3xl font-semibold text-white">cabaguideについて</h1>
        <p className="text-sm text-white/80">
          フッターの「これはなに？」から辿り着いたあなたへ。cabaguideが解決したい課題と、私たちが提供する価値を4つの柱でご紹介します。
        </p>
      </section>

      {aboutSections.map(({ title, body }) => (
        <section
          key={title}
          className="space-y-3 border-b border-white/15 px-4 pb-8"
        >
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {body.map((text) => (
            <p key={text} className="text-sm leading-relaxed text-white/80">
              {text}
            </p>
          ))}
        </section>
      ))}
    </PageFrame>
  );
}
