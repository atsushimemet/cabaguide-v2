# 開発計画: cabaguide エリア管理

## 1. 概要
- 目的: cabaguide で扱う都道府県/繁華街データを Supabase 上の `area` テーブルに登録し、フロントで利用できるようにする。
- 成果物: テーブル定義 SQL、CSV 取り込み用 INSERT SQL、インフラ/アプリ側の利用方法を示すドキュメントやコード。
- スコープ外: Supabase プロジェクト自体の構築、実運用用の管理画面開発。

## 2. 要件整理
1. エリアは「都道府県 (大分類)」「繁華街 (小分類)」の組み合わせで表現する。
2. `src/data/area.csv` をソースとして Supabase (PostgreSQL) に `area` テーブルを作成しデータ登録する。
   - CSV は `id`, `todofuken_name`, `downtown_name` の 3 列。
   - 型: `id` INT, `todofuken_name` TEXT, `downtown_name` TEXT。
3. `area` テーブルのスキーマを作成する SQL を準備する。
4. 作成したスキーマに CSV 値を投入する INSERT SQL を作成する。
5. フロントエンドで `area` テーブルを参照できる仕組み (API or 静的生成) を整備する。

## 3. 実装方針
1. `supabase/migrations/` (新規作成) に `area` テーブル用のスキーマ SQL を置く。PK, ユニーク制約、インデックスを設定。
2. CSV を Node スクリプトか `psql \copy` で読み込み、INSERT 文を自動生成。再投入しやすいよう idempotent なスクリプトにする。
3. Supabase への適用手順を README などに記載し、DB とアプリの同期が追跡できるようにする。
4. フロント側は以下いずれかのパターンを想定して検討:
   - ビルド時 (Next.js) に `area` データをフェッチし `public` へ JSON 出力。
   - API Route で Supabase クエリを提供。
   - まずは `src/data/areas.ts` に静的 JSON を自動生成し、後で API 化する。
5. 型安全のため `Area` 型定義を共通化 (`@/types/area.ts`) し、バックエンド/フロント双方で利用する。

## 4. タスク分解
1. **データ調査**: `area.csv` を検証 (重複/NULL/文字コード) し、投入前にクレンジングルールを決定。
2. **スキーマ設計**:
   - `area` テーブル定義 (PK, NOT NULL, INDEX)。
   - 監査用の `created_at/updated_at` 追加可否検討。
   - マスタとして参照する用途を想定した API スキーマ記述。
3. **マイグレーション作成**: Supabase 互換の SQL を作り、リポジトリに配置。
4. **データ投入用 SQL 生成**: CSV を走査し INSERT 文を生成するスクリプト (Node/TS) を作成。
5. **Supabase 反映手順**: README or docs/dev_2.md 追記で `supabase db push` 等の手順を整備。
6. **フロント連携**:
   - 暫定的に `areas.ts` を生成。
   - 将来的な API への差し替えを意識した抽象化 (リポジトリパターン/フック) を作成。
7. **テスト/検証**:
   - SQL の lint / Supabase ローカル (Docker) でマイグレーション実行。
   - フロントで取得したデータが UI で使用できるか確認 (e.g., エリア選択コンポーネントモック)。

## 5. スケジュール目安
- Day 1: CSV 調査、スキーマ設計レビュー。
- Day 2: マイグレーション実装、データ投入スクリプト作成。
- Day 3: Supabase への適用と検証、フロント側の型/データ連携着手。
- Day 4: フロント利用箇所実装 (例: エリア選択 API / フック)、ユニットテスト追加。
- Day 5: ドキュメント整備、最終レビュー、成果物共有。

## 6. リスクと対策
- **CSV 内重複/誤字**: 事前にユニークチェックツールを走らせ、異常があれば別チケット化。
- **Supabase マイグレーション差分の競合**: `supabase/migrations` を PR 単位で一意のタイムスタンプ名にして衝突を防止。
- **データ更新フロー欠如**: 今後の増減に備え CSV -> SQL 生成スクリプトを CI からも利用できるようにし、自動化を検討。
- **フロント/API 接続の認証**: サーバーサイドフェッチ or Edge Function 経由で鍵を安全に扱う指針を策定。

## 7. 成果物チェックリスト
- [ ] `area` テーブルスキーマ SQL をリポジトリに配置。
- [ ] CSV 由来の INSERT SQL (またはインポート手順) を用意。
- [ ] Supabase へのデータ適用手順を記述。
- [ ] `Area` 型定義を作成し、フロント/サーバー双方で共有。
- [ ] フロントエンドでエリアデータを参照できるコード (ダミー利用箇所) を追加。
- [ ] SQL/TS の Lint & テスト結果を確認。

## 8. Supabase 適用手順メモ
1. `node scripts/build-area-data.mjs` を実行して `src/data/areas.ts` と `supabase/seeds/area.sql` を最新にする。
2. `supabase/migrations/20240601001_create_area_table.sql` を `supabase db push` などで適用し、`area` テーブルを作成。
3. `psql` もしくは Supabase SQL Editor で `supabase/seeds/area.sql` を流し込み、CSV の値を登録 (id 重複時は UPSERT)。
4. フロントエンド側では `@/lib/areas` を経由して `areas` データを参照する。
