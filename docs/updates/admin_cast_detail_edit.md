# /admin/casts/[id] 管理機能の拡張

- キャスト詳細ページで所属店舗を変更できるようにし、store-options API から取得した店舗一覧を使って別店舗へ付け替えられるようになりました。
- SNS リンクは登録済みの各行で「編集」「削除」が可能になり、プラットフォームやURLを更新できます。
- フォロワー履歴一覧をインライン編集・削除できるようにし、誤登録の修正や不要履歴の整理が可能になりました。
- API 側では `/api/admin/casts/[id]` で storeId の更新、`followers` API に PATCH/DELETE、`social-links` API に PATCH を追加し、フロントからの編集操作を支えています。
