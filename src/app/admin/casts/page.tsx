"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { useAdminGuard } from "@/hooks/useAdminSession";
import { useSupabaseBrowserClient } from "@/hooks/useSupabaseBrowserClient";
import { AGE_OPTIONS } from "@/lib/adminOptions";

type StoreOption = {
  id: string;
  name: string;
};

type CastRow = {
  id: string;
  name: string;
  store_id: string;
  age?: number | null;
  image_url?: string | null;
  created_at?: string;
};

type Followers = {
  instagram?: number;
  tiktok?: number;
};

type SnapshotRow = {
  cast_id: string;
  platform: string;
  followers: number;
  captured_at: string;
};

const defaultForm = {
  storeId: "",
  name: "",
  age: "",
  imageUrl: "",
};

export default function AdminCastsPage() {
  const { isChecking, isAuthenticated, logout } = useAdminGuard();
  const { client, error: clientError } = useSupabaseBrowserClient();
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [casts, setCasts] = useState<CastRow[]>([]);
  const [followersMap, setFollowersMap] = useState<Record<string, Followers>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const storeMap = useMemo(() => {
    const map = new Map<string, string>();
    stores.forEach((store) => map.set(store.id, store.name));
    return map;
  }, [stores]);

  const fetchStores = useCallback(async () => {
    if (!client) {
      return;
    }
    const { data } = await client
      .from("stores")
      .select("id, name")
      .order("name", { ascending: true });
    if (data) {
      setStores(data as StoreOption[]);
    }
  }, [client]);

  const fetchFollowers = useCallback(
    async (castIds: string[]) => {
      if (!client || castIds.length === 0) {
        setFollowersMap({});
        return;
      }

      const { data } = await client
        .from("cast_follower_snapshots")
        .select("cast_id, platform, followers, captured_at")
        .in("cast_id", castIds)
        .order("captured_at", { ascending: false });

      if (!data) {
        setFollowersMap({});
        return;
      }

      const snapshotRows = data as SnapshotRow[];
      const newMap: Record<string, Followers> = {};
      for (const row of snapshotRows) {
        const castId = row.cast_id;
        const platform = row.platform;
        const followers = row.followers;

        if (!newMap[castId]) {
          newMap[castId] = {};
        }

        if (platform === "instagram" && newMap[castId].instagram === undefined) {
          newMap[castId].instagram = followers;
        }

        if (platform === "tiktok" && newMap[castId].tiktok === undefined) {
          newMap[castId].tiktok = followers;
        }
      }

      setFollowersMap(newMap);
    },
    [client]
  );

  const fetchCasts = useCallback(async () => {
    if (!client) {
      return;
    }
    setIsLoading(true);
    const { data } = await client
      .from("casts")
      .select("id, name, store_id, age, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      const castRows = data as CastRow[];
      setCasts(castRows);
      const castIds = castRows.map((cast) => cast.id);
      fetchFollowers(castIds);
    }
    setIsLoading(false);
  }, [client, fetchFollowers]);

  useEffect(() => {
    if (client) {
      fetchStores();
      fetchCasts();
    }
  }, [client, fetchStores, fetchCasts]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!client) {
      setFormError(clientError ?? "Supabase クライアントを初期化できませんでした");
      return;
    }

    if (!formState.storeId || !formState.name) {
      setFormError("店舗とキャスト名は必須です");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await client.from("casts").insert({
        store_id: formState.storeId,
        name: formState.name,
        age: formState.age ? Number(formState.age) : null,
        image_url: formState.imageUrl || null,
      });

      if (error) {
        throw error;
      }

      setFormSuccess("キャストを登録しました");
      setFormState(defaultForm);
      fetchCasts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "キャスト登録に失敗しました";
      setFormError(message);
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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">Cast</p>
              <h1 className="text-2xl font-semibold">キャスト登録 & 一覧</h1>
              <p className="text-sm text-white/70">所属店舗を選択し、キャスト登録と SNS 更新を管理します。</p>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              ログアウト
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold">キャストを登録</h2>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm text-white/70">
              店舗 (必須)
              <select
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                value={formState.storeId}
                onChange={(event) => setFormState((prev) => ({ ...prev, storeId: event.target.value }))}
                required
              >
                <option value="">店舗を選択</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </label>

            <Field
              label="キャスト名 (必須)"
              value={formState.name}
              onChange={(value) => setFormState((prev) => ({ ...prev, name: value }))}
              placeholder="夢乃 りん"
            />

            <SelectField
              label="年齢"
              value={formState.age}
              onChange={(value) => setFormState((prev) => ({ ...prev, age: value }))}
              options={AGE_OPTIONS}
              placeholder="任意"
            />

            <Field
              label="メイン画像 URL"
              value={formState.imageUrl}
              onChange={(value) => setFormState((prev) => ({ ...prev, imageUrl: value }))}
              placeholder="https://example.com/cast.jpg"
            />

            {formError && (
              <p className="rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm text-red-100">
                {formError}
              </p>
            )}

            {formSuccess && (
              <p className="rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
                {formSuccess}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 px-4 py-3 text-base font-semibold shadow-lg shadow-indigo-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "登録中..." : "キャストを登録"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">登録済みキャスト</h2>
              <p className="text-sm text-white/70">カードをタップして SNS フォロワーを更新。</p>
            </div>
            <button
              onClick={fetchCasts}
              className="text-sm text-white/70 underline-offset-4 hover:underline"
              disabled={isLoading}
            >
              {isLoading ? "更新中" : "再読み込み"}
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {clientError && (
              <p className="rounded-xl border border-yellow-500/60 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-100">
                {clientError}
              </p>
            )}

            {!client && !clientError && (
              <p className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/70">
                Supabase クライアント初期化中...
              </p>
            )}

            {casts.length === 0 && !isLoading ? (
              <p className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
                まだキャストが登録されていません。
              </p>
            ) : (
              casts.map((cast) => (
                <Link
                  key={cast.id}
                  href={`/admin/casts/${cast.id}`}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-indigo-400/50"
                >
                  <p className="text-base font-semibold">{cast.name}</p>
                  <p className="text-sm text-white/60">{storeMap.get(cast.store_id) ?? `store_id: ${cast.store_id}`}</p>
                  {cast.age && <p className="text-sm text-white/60">{cast.age} 歳</p>}
                  <div className="mt-3 flex gap-3 text-xs text-white/70">
                    <span>IG: {followersMap[cast.id]?.instagram ?? "-"}</span>
                    <span>TT: {followersMap[cast.id]?.tiktok ?? "-"}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const Field = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <label className="block text-sm text-white/70">
    {label}
    <input
      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  </label>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: number[];
  placeholder?: string;
}) => (
  <label className="block text-sm text-white/70">
    {label}
    <select
      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder ?? "選択"}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option} 歳
        </option>
      ))}
    </select>
  </label>
);

const AdminLoading = ({ message = "読み込み中" }: { message?: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
    <p className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/80">{message}</p>
  </div>
);
