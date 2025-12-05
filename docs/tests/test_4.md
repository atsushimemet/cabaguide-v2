# テストケース: design_4 キャスト詳細ページ

## 1. データ取得と組み立て
- **TC-4-1: Cast 詳細 API で参照テーブルを正しく辿れること**  
  前提: Supabase (もしくは mock) 上に `Area` → `Store` → `Cast` が ER 図通りに紐づいたデータがあり、`StoreBasePricing` と `StoreTimeSlotPricing` が `store_id` で保存されている。  
  手順: キャスト詳細ページのフェッチ処理/Hook に対し `castId` を指定して呼び出す。内部で `Cast` を取得後に `store_id` をキーとして `Store` と各 Pricing テーブルを取得させる。  
  期待結果: レスポンスには `cast`, `store`, `store.basePricing`, `store.timeSlots`, `store.area` がすべて揃い、`Cast` モデルに `store` 情報を直接ネストしていない（`storeId` 参照で populate）。

- **TC-4-2: SNS とフォロワー最新値の抽出**  
  前提: `CastSNS` と `CastFollowerSnapshot` テーブルに、Instagram/TikTok それぞれ複数の履歴が登録されている。  
  手順: キャスト詳細の SNS セクションを取得するメソッドを実行し、`platform` ごとに `captured_at` DESC で 1 件取得する処理を通す。  
  期待結果: SNS リンクは全て列挙され、フォロワー数は各 `platform` の最新値で表示される。総フォロワー数は最新値の合算で算出される。

## 2. 料金計算ユーティリティ `calculateBudget`
- **TC-4-3: 1h スロットを起点にした 2h 見積もり**  
  前提: `StoreTimeSlotPricing` に 20:00〜24:59 まで 1h ごとの料金 (例: 20:00, 21:00, 22:00, 23:00, 24:00 スロット) が登録済み。`calculateBudget` に開始時刻 21:00、来店人数 3 名、通常テーブル (VIP false) を渡す。  
  期待結果: 21:00 開始の場合は 21:00〜21:59 の `mainPrice` を 1h 目、22:00〜22:59 の `mainPrice` を 2h 目として足し合わせる。小計には 2h 合計の `mainPrice` × 3 名が積算され、デフォルトの 2 時間滞在想定を UI に表示できる。

- **TC-4-4: VIP 指定時の `vipPrice` 反映**  
  前提: 同じデータで VIP フラグを true にしてリクエスト。  
  手順: `calculateBudget` を呼び出し、前テストと比較する。  
  期待結果: 21:00・22:00 の 1h スロット選択は同じだが、各時間の人数料金には `vipPrice` が使用されるため通常席と異なる合計になる。

- **TC-4-5: 指名料/キャストドリンク/サービス料/税の適用順序**  
  前提: `nomination_price = 3000`, `light_drink_price = 2500`, `service_fee_rate = 0.25` の `StoreBasePricing`。指名人数 2、キャストドリンク 3 杯、来店人数 2 で計算する。  
  手順: `calculateBudget` に上記パラメータを渡して計算する。  
  期待結果: 小計に 2h (連続する 1h スロット ×2) の時間帯料金 + 指名料 (3000 × 2 × 2h) + ドリンク (2500 × 3) が順に加算され、その後 `service_fee_rate`、最後に固定の消費税 (10%) を乗算した総額になる。`light_drink_price` が未設定の場合は 2,000 円固定値にフォールバックすることも合わせて確認する。

## 3. キャッシュ/表示
- **TC-4-7: React Query/SSG キャッシュでの再取得抑制**  
  前提: キャスト詳細ページを React Query もしくは SSG で構築し、同じ `castId` への遷移を繰り返す。  
  手順: 初回アクセスでデータを取得後、別 UI 操作から同じキャスト詳細へ遷移する。  
  期待結果: キャッシュ済みデータが利用され、不要な Supabase リクエストが発生しない。フォーム入力時の予算計算はフロントのみで完結する。
