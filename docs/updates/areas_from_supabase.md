# Supabase のエリアテーブルに移行
- これまで `src/data/areas.ts` で管理していたエリアマスタを削除し、Supabase `areas` テーブルから読み込むように統一。
- `groupAreasByPrefecture`, `findDowntownsByPrefecture`, `getAreaById` などのエリア関連 API をすべて非同期に変更し、最新データが常に反映されるようにした。
- 都道府県／繁華街選択ページ、キャスト・店舗の各ページ、管理画面を含む全てのエリア参照コードを新 API に合わせて更新。
- キャストカードや店舗ページの繁華街表示が Supabase 由来の値と一致するため、管理画面でのエリア更新が即フロントに反映される。
