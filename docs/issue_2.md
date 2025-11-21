# エリアの開発

# 目的
cabaguideで取り扱うエリアをDBに登録し、フロントエンドで利用可能にする。

# 要件
1. エリアは都道府県（大分類）、繁華街（小分類）に分割できるものとする。
2. src/dataディレクトリあるarea.csvをSupabaseのDBにareaテーブルとして登録する。
   1. area.csvは3列からなる。
   2. 1列目はid列でINT型
   3. 2列目はtodofuken_name列でSTRING型
   4. 3列目はdowntown_name列でSTRING型
3. areaテーブルのスキーマを登録するsqlを作成する
4. 作成されたスキーマに対してarea.csvの値をinsertするsqlを作成する
