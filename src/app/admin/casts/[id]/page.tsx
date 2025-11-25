"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { useAdminGuard } from "@/hooks/useAdminSession";
import { useSupabaseBrowserClient } from "@/hooks/useSupabaseBrowserClient";

type CastRow = {
  id: string;
  name: string;
  store_id: string;
  age?: number | null;
  image_url?: string | null;
};

type StoreRow = {
  id: string;
  name: string;
};

type SnapshotRow = {
  id: string;
  platform: string;
  followers: number;
  captured_at: string;
};

export default function CastDetailPage() {
  const params = useParams<{ id: string }>();
  const castId = params?.id;
  const { isChecking, isAuthenticated, logout } = useAdminGuard();
  const { client, error: clientError } = useSupabaseBrowserClient();
  const [cast, setCast] = useState<CastRow | null>(null);
  const [store, setStore] = useState<StoreRow | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [latestFollowers, setLatestFollowers] = useState<{ instagram?: number; tiktok?: number }>({});
  const [formState, setFormState] = useState({ instagram: "", tiktok: "" });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCast = useCallback(async () => {
    if (!client || !castId) {
      return;
    }

    const { data } = await client
      .from("casts")
      .select("id, name, store_id, age, image_url")
      .eq("id", castId)
      .single();

    if (data) {
      setCast(data as CastRow);
      const { data: storeData } = await client
        .from("stores")
        .select("id, name")
        .eq("id", data.store_id)
        .single();
      if (storeData) {
        setStore(storeData as StoreRow);
      }
    }
  }, [client, castId]);

  const fetchSnapshots = useCallback(async () => {
    if (!client || !castId) {
      return;
    }

    const { data } = await client
      .from("cast_follower_snapshots")
      .select("id, platform, followers, captured_at")
      .eq("cast_id", castId)
      .order("captured_at", { ascending: false })
      .limit(20);

    if (data) {
      const rows = data as SnapshotRow[];
      setSnapshots(rows);
      const latest: { instagram?: number; tiktok?: number } = {};
      rows.forEach((row) => {
        if (row.platform === "instagram" && latest.instagram === undefined) {
          latest.instagram = row.followers;
        }
        if (row.platform === "tiktok" && latest.tiktok === undefined) {
          latest.tiktok = row.followers;
        }
      });
      setLatestFollowers(latest);
    }
  }, [client, castId]);

  useEffect(() => {
    if (client) {
      fetchCast();
      fetchSnapshots();
    }
  }, [client, fetchCast, fetchSnapshots]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!client || !castId) {
      setErrorMessage(clientError ?? "Supabase 初期化エラー");
      return;
    }

    const payload = [] as { platform: string; followers: number }[];

    if (formState.instagram) {
      payload.push({ platform: "instagram", followers: Number(formState.instagram) });
    }
    if (formState.tiktok) {
      payload.push({ platform: "tiktok", followers: Number(formState.tiktok) });
    }

    if (payload.length === 0) {
      setErrorMessage("Instagram か TikTok のどちらかを入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const insertPayload = payload.map((item) => ({
        cast_id: castId,
        platform: item.platform,
        followers: item.followers,
        captured_at: now,
      }));

      const { error } = await client.from("cast_follower_snapshots").insert(insertPayload);

      if (error) {
        throw error;
      }

      setStatusMessage("フォロワー数を更新しました");
      setFormState({ instagram: "", tiktok: "" });
      fetchSnapshots();
    } catch (err) {
      const message = err instanceof Error ? err.message : "更新に失敗しました";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return <AdminLoading />;
  }

  if (!isAuthenticated) {
    return <AdminLoading message="認証リダイレクト中" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">Cast detail</p>
              <h1 className="text-2xl font-semibold">{cast?.name ?? "キャスト詳細"}</h1>
              {store && <p className="text-sm text-white/70">所属店舗: {store.name}</p>}
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/casts"
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              >
                一覧へ戻る
              </Link>
              <button
                onClick={logout}
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              >
                ログアウト
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold">SNS フォロワー数を更新</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Instagram</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {latestFollowers.instagram ?? "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">TikTok</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {latestFollowers.tiktok ?? "-"}
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm text-white/70">
              Instagram フォロワー数
              <input
                type="number"
                min="0"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                value={formState.instagram}
                onChange={(event) => setFormState((prev) => ({ ...prev, instagram: event.target.value }))}
                placeholder="2500"
              />
            </label>
            <label className="block text-sm text-white/70">
              TikTok フォロワー数
              <input
                type="number"
                min="0"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                value={formState.tiktok}
                onChange={(event) => setFormState((prev) => ({ ...prev, tiktok: event.target.value }))}
                placeholder="5000"
              />
            </label>

            {errorMessage && (
              <p className="rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm text-red-100">
                {errorMessage}
              </p>
            )}
            {statusMessage && (
              <p className="rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
                {statusMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 px-4 py-3 text-base font-semibold shadow-lg shadow-indigo-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "更新中..." : "フォロワー数を保存"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold">履歴</h2>
          {clientError && (
            <p className="mt-4 rounded-xl border border-yellow-500/60 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-100">
              {clientError}
            </p>
          )}
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            {snapshots.length === 0 ? (
              <li className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                まだ履歴がありません。
              </li>
            ) : (
              snapshots.map((snapshot) => (
                <li key={snapshot.id} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{snapshot.platform}</span>
                    <span className="text-white">{snapshot.followers.toLocaleString()} 人</span>
                  </div>
                  <p className="text-xs text-white/50">
                    {new Date(snapshot.captured_at).toLocaleString("ja-JP")}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

const AdminLoading = ({ message = "読み込み中" }: { message?: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
    <p className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/80">{message}</p>
  </div>
);
