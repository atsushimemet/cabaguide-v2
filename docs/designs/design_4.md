# 開発ノート: dev_4 キャスト詳細ページ

docs/er.md をベースに、キャスト詳細ページ実装時に前提となるデータモデリングを整理する。

## 1. テーブル前提
- **Area**: `id`, `todofuken_name`, `downtime_name`。店舗は必ず所属エリアを参照するため、キャストページでは `Store.area_id` を辿って表示する。
- **Store**: `id`, `area_id`, `name`, `google_map_link`, `phone`。キャスト所属店舗の基本情報を提供。
- **StoreBasePricing**: `store_id` と 1:1。`nomination_price`, `service_fee_rate`, `tax_rate`, `extension_price`, `light_drink_price`, `cheapest_champagne_price` を保持し、指名料・サービス料算出に利用。
- **StoreTimeSlotPricing**: `store_id` と 1:多。`time_slot`, `main_price`, `vip_price` を保持し、予算計算時に 2h 分のベース料金を求める。
- **Cast**: `store_id` と 1:多。`name`, `age`, `image_url` を保持。詳細ページのメイン情報。
- **CastSNS**: `cast_id` と 1:多。`platform`, `url` を保持し、プロフィール欄に表示するリンクを抽出。
- **CastFollowerSnapshot**: `cast_id` と 1:多。`platform`, `followers`, `captured_at` を持ち、最新レコードを Instagram/TikTok 別に抽出して表示。総フォロワー数はプラットフォームごとの最新値合算。

## 2. 型定義・モックデータ方針
```ts
type Area = { id: string; todofukenName: string; downtownName: string };

type Store = {
  id: string;
  areaId: string;
  name: string;
  googleMapLink: string;
  phone: string;
  basePricing: StoreBasePricing;
  timeSlots: StoreTimeSlotPricing[];
};

type StoreBasePricing = {
  nominationPrice: number;
  serviceFeeRate: number;
  taxRate: number;
  extensionPrice: number;
  lightDrinkPrice: number;
  cheapestChampagnePrice: number;
};

type StoreTimeSlotPricing = {
  timeSlot: string; // '20:00', '22:00' etc.
  mainPrice: number;
  vipPrice: number;
};

type Cast = {
  id: string;
  storeId: string;
  name: string;
  age: number;
  imageUrl: string;
  sns: CastSNS[];
  followerSnapshots: CastFollowerSnapshot[];
};
```

- `mockCasts` に `store` 情報をネストせず、`storeId` を参照させて `mockStores` から populate することで ER 図の参照関係を保つ。
- SNS とフォロワー履歴は `platform` 別に `latestFollowers` を求めるユーティリティで抽象化する。

## 3. 予算計算ロジックとテーブル活用
1. **時間帯料金**: `StoreTimeSlotPricing` から開始時間に最も近い `time_slot` を 2h 分引用する（例: 21時開始なら 21〜23 時スロットの `main_price` を使用）。
2. **人数料金**: `main_price` × `来店人数`。VIP 指定時は `vip_price` を利用。
3. **指名キャスト数**: `nomination_price` × `指名人数` × 2h。
4. **キャストドリンク**: 1杯 2,000 円（`light_drink_price` が定義されていればそれを優先）。
5. **サービス料/税**: 合計小計に `service_fee_rate` と `tax_rate` を逐次乗算。
6. **延長料金**: 延長操作が追加された場合 `extension_price` × 延長回数で加算できるよう開口部を残す。

## 4. データ取得計画
- **API 層**: Supabase もしくは mock から `Cast` を取得 -> `store_id` で `Store` をフェッチ -> さらに `StoreBasePricing` / `StoreTimeSlotPricing` を `select('*')` + `eq('store_id', storeId)` で取得。
- **SNS/フォロワー**: `cast_id` に紐づく最新 `CastSNS`, `CastFollowerSnapshot` を取得し、`platform` ごとに `order('captured_at', { ascending: false })` で1件ずつ抽出。
- **クライアントキャッシュ**: React Query か SSG でデータをキャッシュし、フォーム入力時にはフロントのみで計算。

## 5. 今後のタスク
1. Supabase へ各テーブルの migration/seed を投入。
2. `src/types/cast.ts` (仮) に上記型を実装し、API レイヤーの返り値を型安全にする。
3. 料金計算ユーティリティ `calculateBudget(params)` を実装し、`docs/designs/design_4.md` の要件と突き合わせたテストを書く。
4. SNS/フォロワーの最新値抽出の単体テストを追加して、履歴テーブルのデータ増加にも耐えられるようにする。

ER 図の前提を満たすデータを先に整えることで、キャスト詳細ページの UI 実装時に mock 依存を減らし、Supabase 連携へスムーズに移行できる。
