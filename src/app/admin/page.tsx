"use client";

import Link from "next/link";

import { AdminFooter } from "@/components/AdminFooter";
import { PageFrame } from "@/components/PageFrame";
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
    <PageFrame mainClassName="gap-10">
      <header className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Admin</p>
            <h1 className="text-2xl font-semibold">管理者ダッシュボード</h1>
            <p className="text-sm text-white/70">
              店舗とキャストの登録、SNS フォロワー更新をここから開始できます。
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <Link
          href="/admin/store"
          className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-pink-400/60"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-pink-200/80">Store</p>
          <h2 className="mt-3 text-xl font-semibold">店舗登録</h2>
          <span className="mt-4 inline-flex items-center text-sm text-pink-200 group-hover:gap-2">
            登録フォームを開く →
          </span>
        </Link>

        <Link
          href="/admin/casts"
          className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-indigo-400/60"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-200/80">Cast</p>
          <h2 className="mt-3 text-xl font-semibold">キャスト登録</h2>
          <span className="mt-4 inline-flex items-center text-sm text-indigo-200 group-hover:gap-2">
            キャスト一覧を見る →
          </span>
        </Link>
      </div>

      <AdminFooter onLogout={logout} />
    </PageFrame>
  );
}

const AdminLoading = ({ message = "認証情報を確認しています" }: { message?: string }) => (
  <PageFrame mainClassName="flex min-h-[320px] items-center justify-center">
    <p className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/80">{message}</p>
  </PageFrame>
);
