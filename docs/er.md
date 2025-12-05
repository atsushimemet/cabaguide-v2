# Cabaguide 初期版 ER 図 (最小構成)
## テーブル定義
### Area
id
todofuken_name 都道府県名
downtime_name 繁華街名

### Store
id
area_id FK to Area.id
name 店舗名
google_map_link Google マップの URL
phone 電話番号

### StoreBasePricing: 店舗ごとに共通の料金要素
id
store_id FK to Store.id
nomination_price 指名料金
service_fee_rate サービス料パーセンテージ
light_drink_price 軽ドリンク目安価格
cheapest_champagne_price 最安シャンパン価格

### StoreTimeSlotPricing: 時間帯によって変わる料金
id
store_id FK to Store.id
time_slot 例 20 22 など開始時間
main_price メイン料金
vip_price VIP料金

### Cast
id
store_id FK to Store.id
name キャスト名
age 年齢
image_url メイン画像 URL

### CastSNS
id
cast_id FK to Cast.id
platform instagram tiktok x など
url SNS プロフィールの URL

### CastFollowerSnapshot: フォロワー数の履歴
id
cast_id FK to Cast.id
platform instagram tiktok x など
followers 取得時点のフォロワー数
captured_at 取得日時

## リレーション
Area 1 対 多 Store
Store 1 対 1 StoreBasePricing
Store 1 対 多 StoreTimeSlotPricing
Store 1 対 多 Cast
Cast 1 対 多 CastSNS
Cast 1 対 多 CastFollowerSnapshot
