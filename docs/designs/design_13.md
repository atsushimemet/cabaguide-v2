# 開発ノート: design_13 モックデータ廃止と Supabase 連携

issue_13 の要件に沿い、トップ/キャストリスト/キャスト詳細ページのデータ源をモックから DB (Supabase) へ切り替えるための設計をまとめる。

## 1. 背景と目的
- これまで `src/data/mock*.ts` に定義した固定データで UI を構築しており、仕様確定後に本番データへ移行するフェーズになった。
- 管理画面 (`/admin/*`) で登録した実データをフロントに反映させ、すべての繁華街分のキャスト/店舗情報を動的に取得できるようにする。
- 手動入稿した DB の値が唯一のソースとなるよう、モック依存を除去する。

## 2. 対象画面と概要
| 画面 | 現状 | 変更後 |
| --- | --- | --- |
| トップページ (`/`) | `topCasts` モック配列 | Supabase RPC or View で「フォロワー上位キャスト + 店舗情報」を取得 |
| キャスト一覧 (`/casts/[downtownId]`) | `getCastsByDowntownId` (mock) | `stores`, `casts`, `areas` を join した結果を取得 |
| キャスト詳細 (`/casts/[downtownId]/[castId]`) | `getCastDetail` (mock) | キャスト + 店舗 + SNS + followers を Supabase から取得 |

## 3. データモデル整理
既存の Supabase テーブル (想定):
- `areas` (id, todofuken_name, downtown_name, etc.)
- `stores` + `store_base_pricings` + `store_time_slot_pricings`
- `casts`
- `cast_sns_profiles` or `cast_sns_links` (無い場合は `CastSNS` を直接 `cast_sns` テーブルに格納)
- `cast_follower_snapshots`

追加で必要なビュー/型:
- **トップページ用ビュー** `view_top_casts` (downtown_id, cast_id, followers, store info)。`followers` 降順で10件取得するクエリをフロントで組んでもよい。
- **キャスト一覧用 API**: `GET /api/casts?downtownId=xx` のように Next.js Route Handler を介し Supabase サービスロールを使用。RLS を考慮し API サーバー側でまとめて取得。
- **キャスト詳細 API**: キャスト基本情報 + store + follower snapshots + SNS をまとめて返す RPC/REST。

## 4. 実装方針
1. **データ取得レイヤー**
   - `src/lib/supabase-client.ts` (ブラウザ) と `src/lib/supabase-server.ts` (サーバー) を分け、サーバー側は `SUPABASE_SERVICE_ROLE_KEY` を使用して RLS を気にせず取得できるようにする。
   - もしくは Next.js Route Handler (`/api/public/casts`, `/api/public/cast-detail`) を設け、フロントは fetch API 経由でデータ取得。
2. **モック削除手順**
   - `src/data/mockStores.ts`, `src/data/mockCasts.ts`, `src/data/topCasts.ts` などを段階的に削除し、それぞれを Supabase 取得に置き換える。
   - `getCastDetail`, `getCastsByDowntownId`, `topCasts` import の参照先を新しい API/ライブラリへ差し替える。
3. **型整備**
   - Supabase の `types.ts` (generate した型) を使用し、`Cast`, `Store` などの型を DB 構造に合わせて更新。
   - 既存の `Store` 型に `slug` 等フィールド追加済みであれば DB 上にも持たせる。
4. **キャッシュ戦略**
   - 静的ビルドではなくリクエスト時の動的取得とし、`fetch` に `next: { revalidate: 60 }` を設定するなど SSR + ISR の併用を検討。

## 5. API/クエリ設計 (例)
### トップページ
```ts
// server component 内
const { data } = await supabaseServer.rpc("top_casts", { limit_count: 10 });
```

### キャスト一覧
```ts
const { data } = await supabaseServer
  .from("casts")
  .select(
    `
      id, name, followers, store:stores(id, name, slug),
      area:areas(id, todofuken_name, downtown_name)
    `
  )
  .eq("downtown_id", downtownId)
  .order("followers", { ascending: false });
```

### キャスト詳細
```ts
const { data: cast } = await supabaseServer
  .from("casts")
  .select(
    `
      *,
      store:stores(*, base_pricing:store_base_pricings(*), time_slots:store_time_slot_pricings(*)),
      sns:cast_sns(*),
      followerSnapshots:cast_follower_snapshots(*)
    `
  )
  .eq("downtown_id", downtownId)
  .eq("id", castId)
  .single();
```

## 6. 手動データ入稿手順 (開発外作業)
1. 管理画面を用いて、各繁華街ごとに店舗情報・キャスト情報を登録。
2. `store_base_pricings`, `store_time_slot_pricings` も必須フィールドを埋める。
3. SNS 情報・フォロワー履歴を登録 (最低1件)。
4. すべての `areas` に対して、キャストデータが存在することをチェックリスト化。

## 7. タスク分解
1. Supabase クライアント初期化 (`lib/supabase-server.ts`, `lib/supabase-browser.ts`)。
2. `topCasts` 取得ロジックを Supabase 呼び出しへ置換、モック削除。
3. キャスト一覧のデータフェッチを `mockCasts` から Supabase へ変更。
4. `getCastDetail` を Supabase クエリに書き換え、`BudgetCalculator` へ渡す store 情報も DB の値を利用。
5. `/api` レイヤーや server component でのエラーハンドリングを実装 (`notFound()`, fallback UI)。
6. 不要になったモックファイルを削除し、依存 import を整理。

## 8. テスト観点
- すべての繁華街でキャスト一覧が表示される（手動で複数 area_id を spot-check）。
- トップページの10名が DB 更新に合わせて変わる (フォロワー数ソート)。
- キャスト詳細で店舗/料金/フォロワー履歴が DB の内容と一致。
- 管理画面でデータを更新するとフロントに反映される (キャッシュを考慮し 60 秒程度で確認)。
- Lint/Type Check が通る。

## 9. リスクと対策
- **データ不完全**: 店舗やキャストが未登録だとページが `notFound` になる。入稿チェックリストを用意し、DB 側で必須制約を設定。
- **Supabase 呼び出し回数**: 同一ページで複数テーブルにアクセスすると遅延が発生。`select` のネストや RPC を活用して round trip を削減。
- **RLS**: 公開ページ用には RLS をオフにするか、サービスロールキーでサーバーが代理取得。クライアントから直接 DB へアクセスしない。

本設計で、モックへ依存していたトップ/キャストページ群を完全に Supabase データへ移行し、プロダクトの本番データ運用へ移行できる。

## 10. 追加仕様
- `store_base_pricings` に保持する **軽ドリンク目安** と **最安シャンパン目安価格** は「未設定」を表現できるよう `NULL` を許容する。フロントは `NULL` の場合に未入力表示を行い、入力フォームもクリア可能にする。
- `store_time_slot_pricings` のタイムスロット料金は 100 円単位の自由入力に切り替える。従来のプルダウン選択は廃止し、管理画面では数値入力 (step=100) に統一、DB 側は整数カラムに直接値を保存する。
