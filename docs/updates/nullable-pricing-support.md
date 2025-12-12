# Null許容の料金データ対応とインポート改善

## 概要
- 店舗基本料金の `nomination_price` / `service_fee_rate` を DB・API・UI のすべてで null を許容するよう調整し、サービス料率が未設定でも正しく表示・計算できるようにしました。
- `/data/*.csv` を読み込んで本番 Supabase に反映する `scripts/import-store-data.mjs` を強化し、実行時に `--reset` で既存データをクリアしてから再投入したり、CSV の `"NULL"` 文字列や時間帯重複を安全に処理できるようにしました。
- Supabase には `20250304001_allow_null_service_fee_rate.sql` / `20250304002_allow_null_nomination_price.sql` を追加し、`store_base_pricings` の該当カラムの NOT NULL 制約を解除しています。
