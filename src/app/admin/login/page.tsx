"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PageFrame } from "@/components/PageFrame";
import { hasAdminSession, persistAdminSession } from "@/hooks/useAdminSession";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (hasAdminSession()) {
      router.replace("/admin");
      return;
    }

    const verifyExistingSession = async () => {
      try {
        const response = await fetch("/api/admin/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (!isActive) {
          return;
        }

        if (response.ok) {
          persistAdminSession();
          router.replace("/admin");
        }
      } catch {
        // ignore, user must log in
      }
    };

    verifyExistingSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "認証に失敗しました");
        setIsSubmitting(false);
        return;
      }

      persistAdminSession();
      router.replace("/admin");
    } catch (err) {
      const message = err instanceof Error ? err.message : "認証に失敗しました";
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <PageFrame mainClassName="items-center justify-center">
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
    </PageFrame>
  );
}
