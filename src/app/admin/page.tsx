"use client";

import Link from "next/link";

import { useAdminGuard } from "@/hooks/useAdminSession";

export default function AdminDashboardPage() {
  const { isChecking, isAuthenticated, logout } = useAdminGuard();

  if (isChecking) {
    return <AdminLoading />;
  }

  if (!isAuthenticated) {
    return <AdminLoading message="認証情報を確認しています" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <header className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Admin</p>
            <h1 className="text-2xl font-semibold">管理者ダッシュボード</h1>
            <p className="text-sm text-white/70">
              店舗とキャストの登録、SNS フォロワー更新をここから開始できます。
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="mx-auto mt-10 grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <Link href="/admin/shop" className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-pink-400/60">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-pink-200/80">
            Store
          </p>
          <h2 className="mt-3 text-xl font-semibold">店舗登録ページへ</h2>
          <p className="mt-2 text-sm text-white/70">
            繁華街・料金テーブルまでスマホで一括登録。登録履歴も /admin/shop で確認できます。
          </p>
          <span className="mt-4 inline-flex items-center text-sm text-pink-200 group-hover:gap-2">
            登録フォームを開く →
          </span>
        </Link>

        <Link href="/admin/casts" className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-indigo-400/60">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-200/80">
            Cast
          </p>
          <h2 className="mt-3 text-xl font-semibold">キャスト登録 & 一覧</h2>
          <p className="mt-2 text-sm text-white/70">
            所属店舗を選んでキャスト登録。SNS フォロワー更新は一覧から詳細ページに遷移できます。
          </p>
          <span className="mt-4 inline-flex items-center text-sm text-indigo-200 group-hover:gap-2">
            キャスト一覧を見る →
          </span>
        </Link>
      </main>
    </div>
  );
}

const AdminLoading = ({ message = "認証情報を確認しています" }: { message?: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
    <p className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/80">
      {message}
    </p>
  </div>
);
