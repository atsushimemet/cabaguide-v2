# 開発ノート: design_6 管理者ログインとキャスト登録導線

issue_6 の要求に基づき、管理者向けログイン〜店舗/キャスト登録、キャスト SNS 情報更新までのフローを整理する。

## 1. 背景と目的
- 現行は店舗/キャストがモックデータ。スマホで登録できない。
- 管理者用ログインを用意し、店舗、キャスト情報を即時登録できるようにする。
- キャストのSNSフォロワー数を登録できるようにしたい。

## 2. ルーティング構成
| パス | 役割 | 備考 |
| --- | --- | --- |
| `/admin/login` | 管理者ログイン (パスワード 1 フィールド) | `.env` の `ADMIN_PASSWORD` と一致したらセッション確立 |
| `/admin` | 管理者トップ。店舗登録・キャスト登録カードを表示 | 各導線は内部遷移リンク |
| `/admin/shop` | 店舗登録専用ページ | `/admin` の登録フォームを切り出し、完了後一覧を表示 |
| `/admin/casts` | 登録済キャスト一覧 | 写真が無い場合はプレースホルダーでカード表示 |
| `/admin/casts/[id]` | キャスト詳細編集。SNS フォロワー数入力 | Instagram/TikTok のみ扱う |

- ランタイムパスワードはクライアント側のみで照合し、成功時に `sessionStorage` 等へフラグを保存。サーバーレンダリングを避け、`next/dynamic` もしくは `useEffect` で初回読み込み時に検証。
- ルーティングガードは `middleware.ts` または layout で実装し、セッションがない場合 `/admin/login` へ強制リダイレクト。

## 3. 認証仕様
1. `.env` に `NEXT_PUBLIC_ADMIN_PASSWORD` (または `ADMIN_PASSWORD`) を定義し、build 時に注入。
2. `/admin/login` で入力された値が一致すれば `sessionStorage.setItem('cabaguide-admin', '1')`。
3. 認証済であれば `/admin` へ遷移。未認証ならフォームにエラーメッセージを表示。
4. ログアウトは `/admin` のヘッダーにボタンを置き、ストレージを削除して `/admin/login` へ戻す。

## 4. 店舗登録フォーム (/admin, /admin/shop)
| フィールド | 必須 | UI | 型/レンジ |
| --- | --- | --- | --- |
| 繁華街 | ✔ | `<select>` | `area_id` と `downtown_name` 表示。`areas` テーブルから取得 |
| 店舗名 | ✔ | `<input type="text">` | 100 文字程度まで |
| Google マップ URL | ✔ | `<input type="url">` | pattern チェック |
| 電話番号 | ✔ | `<input type="tel">` | `^\d{2,4}-\d{2,4}-\d{3,4}$` を想定 |
| 指名料金 | ✖ | ピッカー (`select` 1000〜10000, 1000 刻み) | `StoreBasePricing.nomination_price` |
| サービス料率 | ✖ | ピッカー (0.10〜0.50, 0.05 刻み) | `StoreBasePricing.service_fee_rate` |
| 税率 | ✖ | 数値入力 (デフォ 0.10) | 任意小数。`step="0.01"` |
| 延長料金 | ✖ | ピッカー (1000〜10000, 1000 刻み) | `StoreBasePricing.extension_price` |
| 軽ドリンク価格 | ✖ | 数値入力 (デフォ 2000) | `StoreBasePricing.light_drink_price` |
| 最安シャンパン価格 | ✖ | 数値入力 (デフォ 25000) | `StoreBasePricing.cheapest_champagne_price` |
| タイムスロット | ✔ | 20〜24 時まで 1h ごとにまとめ入力 | `StoreTimeSlotPricing.time_slot` |
| メイン料金 | ✔ | 各タイムスロットごとにピッカー (1000〜20000, 1000 刻み) | `StoreTimeSlotPricing.main_price` |
| VIP 料金 | ✖ | 各タイムスロットごとにピッカー (5000〜50000, 1000 刻み) | `StoreTimeSlotPricing.vip_price` (未入力可) |

- `Store`, `StoreBasePricing`, `StoreTimeSlotPricing` への insert 3 件を 1 トランザクションで実行。Supabase RPC もしくは `supabase.from(...).insert([...]).select()` を順次叩く。
- モバイルピッカーは `<select>` をベースにし、`inputmode="numeric"` で数値キーボードを出す。
- バリデーション失敗時は toast or inline メッセージ。
- `/admin` トップでは簡易フォームを表示し、より詳細な編集や既存店舗の一覧/検索は `/admin/shop` に分離して扱う。`/admin/shop` で登録完了後に最新版リストが確認できるようテーブル/カードを表示する。
- タイムスロットは 20/21/22/23/24 時の 5 件を同時に登録するコンポーネントを用意し、一括で `store_time_slot_pricings` へ insert する。

## 5. キャスト登録導線 (/admin)
1. 店舗登録カードとキャスト登録カードの 2 カラム (モバイルでは縦並び)。
2. キャスト登録フォーム:
   - 店舗選択: `Store.id` & `Store.name` を `<select>` で表示。
   - キャスト名: 必須テキスト。
   - 年齢: 任意セレクト (18〜40)。
   - 画像 URL: 任意テキスト。初期は空を許容。
3. `casts` テーブルに insert し、成功後 `/admin/casts` へ遷移 or 成功メッセージ表示。

## 6. キャスト一覧 (/admin/casts)
- Supabase から `casts` を取得し、店舗名/繁華街名は `stores` と `areas` を join。
- カード構成: 名前、所属店舗、年齢、Instagram/TikTok 最新フォロワー (あれば)。
- カードタップで `/admin/casts/[id]`。`next/link` で囲う。

## 7. キャスト詳細 (/admin/casts/[id])
- 編集フィールド:
  - Instagram フォロワー数 (整数)
  - TikTok フォロワー数 (整数)
- 入力後に `CastFollowerSnapshot` へ insert。
  - `platform` カラムに `'instagram'` / `'tiktok'`。
  - `captured_at` はサーバータイムスタンプ (`new Date().toISOString()` or Supabase default `now()`).
- 最新値を画面上部に表示し、過去履歴は別途リスト化しておくと運用しやすい。

## 8. データアクセスと型
- `src/lib/supabase.ts` でブラウザ向けクライアントを作成済みなら流用。無い場合は admin ページ専用クライアントを追加。
- 型定義を `src/types/admin.ts` (新規) にまとめる:
  - `type AdminStorePayload`
  - `type AdminCastPayload`
  - `type CastFollowerSnapshotPayload`
- React Hook Form + Zod でバリデーションを共通化するとフォーム数が増えても保守しやすい。

## 9. タスク分解
1. `.env.example` に `ADMIN_PASSWORD` を追加し、Next コンフィグで公開。
2. `middleware.ts` で `/admin` 配下へのアクセスをチェックするか、`AdminGuard` コンポーネントを用意。
3. `/admin/login` ページとカスタム hook (`useAdminSession`) を実装。
4. `/admin` ページで店舗登録フォームとキャスト登録フォームを実装。共通フィールド (ラベル/入力) を部品化。
5. ピッカー (select options) を `utils/pickers.ts` 的なモジュールで一元管理。
6. Supabase への insert 処理とトランザクション対策 (失敗時ロールバック) を実装。
7. `/admin/shop` ルートを追加し、店舗登録フォーム/一覧を切り出す。
8. `/admin/casts` 一覧を `Suspense` + `useEffect` でデータ取得し、カード UI を Tailwind で整える。
9. `/admin/casts/[id]` ページでフォロワー入力フォームと履歴テーブルを実装。
10. `captured_at` の自動登録を確認するため、E2E 的に 1 件登録 → SNS 更新まで手動テスト。

## 10. 受け入れ条件
- `.env` のパスワードと一致した場合のみ `/admin` 以下を操作できる。
- 店舗登録フォームで必須項目をすべて入力すると Supabase に Store/StoreBasePricing/StoreTimeSlotPricing が作成される。
- キャスト登録フォームで入力したキャストが `/admin/casts` に表示される。
- キャストカードをタップすると `/admin/casts/[id]` に遷移し、Instagram/TikTok フォロワー数を登録でき、`captured_at` が登録時刻になる。
- すべてのフォームがスマホから操作しやすいピッカー/数値入力で構成されている。
