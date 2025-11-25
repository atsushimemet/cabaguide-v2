"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { hasAdminSession, persistAdminSession } from "@/hooks/useAdminSession";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (hasAdminSession()) {
      router.replace("/admin");
    }
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!ADMIN_PASSWORD) {
      setError("環境変数 NEXT_PUBLIC_ADMIN_PASSWORD が設定されていません");
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    if (password === ADMIN_PASSWORD) {
      persistAdminSession();
      router.replace("/admin");
    } else {
      setError("パスワードが正しくありません");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg"
      >
        <h1 className="text-2xl font-semibold">管理者ログイン</h1>
        <p className="mt-2 text-sm text-white/70">営業メンバー専用ページです。</p>

        <label className="mt-8 block text-sm font-medium text-white/80">
          パスワード
          <input
            type="password"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white focus:border-white focus:outline-none"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            placeholder="********"
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm text-red-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 px-4 py-3 text-base font-semibold shadow-lg shadow-purple-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "認証中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}
