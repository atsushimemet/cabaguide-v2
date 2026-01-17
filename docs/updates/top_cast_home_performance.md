# ホームTOPキャスト: パフォーマンス改善
- `cast_latest_follower_totals` ビューを追加し、各キャストの最新フォロワー合計をあらかじめ集計できるようにした。
- ホームの `getTopCasts` は同ビューから上位キャストのIDとフォロワー数のみを取得し、必要なキャスト/店舗情報だけをフェッチするよう変更。
- これによりトップページ生成時に全キャスト分のデータを取得・集計する処理が不要になり、TTFB と LCP を短縮できる。
- `EditorialHero` を CSS アニメーション主体のサーバーコンポーネントに再実装し、初回ロード時の JavaScript 実行コストと描画ブロックを削減。
- ホームページを `revalidate = 600` の ISR 配信に切り替え、PSI 計測時の TTFB を安定化させた。
- `TopCastCarousel` をビューポート進入時に動的ロードする `TopCastCarouselLazy` へ差し替え、初期JSバンドル/TBTを圧縮しつつフォールド下の描画を遅延させるようにした。
- Hero 用のプリロード資産を追加（`/images/hero/glow.svg` と `GeistHero` フォント）し、`<head>` で即時プリロード＆CSS側で利用することで LCP/Speed Index をさらに短縮。
