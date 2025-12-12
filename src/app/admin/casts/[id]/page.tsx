"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { AdminFooter } from "@/components/AdminFooter";
import { PageFrame } from "@/components/PageFrame";
import { useAdminGuard } from "@/hooks/useAdminSession";

const SOCIAL_PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
] as const;

type SocialPlatform = (typeof SOCIAL_PLATFORM_OPTIONS)[number]["value"];

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

type SocialLink = {
  id: string;
  platform: string;
  url: string;
};

export default function CastDetailPage() {
  const params = useParams<{ id: string }>();
  const castId = params?.id;
  const { isChecking, isAuthenticated, logout } = useAdminGuard();
  const [cast, setCast] = useState<CastRow | null>(null);
  const [store, setStore] = useState<StoreRow | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [latestFollowers, setLatestFollowers] = useState<{ instagram?: number; tiktok?: number }>({});
  const [formState, setFormState] = useState({ instagram: "", tiktok: "" });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [socialForm, setSocialForm] = useState<{ platform: SocialPlatform; url: string }>({
    platform: SOCIAL_PLATFORM_OPTIONS[0].value,
    url: "",
  });
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);

  const fetchCastDetail = useCallback(async () => {
    if (!castId) {
      return;
    }
    setDetailError(null);
    try {
      const response = await fetch(`/api/admin/casts/${castId}`, { credentials: "include" });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "キャスト詳細の取得に失敗しました");
      }

      setCast(payload?.cast ?? null);
      setStore(payload?.store ?? null);
      const snapshotRows = Array.isArray(payload?.snapshots) ? (payload.snapshots as SnapshotRow[]) : [];
      setSnapshots(snapshotRows);
      setLatestFollowers(payload?.latestFollowers ?? {});
      const linkRows = Array.isArray(payload?.socialLinks) ? (payload.socialLinks as SocialLink[]) : [];
      setSocialLinks(linkRows);
    } catch (err) {
      const message = err instanceof Error ? err.message : "キャスト詳細の取得に失敗しました";
      setDetailError(message);
      setCast(null);
      setStore(null);
      setSnapshots([]);
      setLatestFollowers({});
      setSocialLinks([]);
    }
  }, [castId]);

  useEffect(() => {
    fetchCastDetail();
  }, [fetchCastDetail]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!castId) {
      setErrorMessage("cast_id が不明です");
      return;
    }

    const instagramValue = formState.instagram ? Number(formState.instagram) : null;
    const tiktokValue = formState.tiktok ? Number(formState.tiktok) : null;

    if (!instagramValue && !tiktokValue) {
      setErrorMessage("Instagram か TikTok のどちらかを入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/casts/${castId}/followers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          instagram: instagramValue ?? undefined,
          tiktok: tiktokValue ?? undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "更新に失敗しました");
      }

      setStatusMessage("フォロワー数を更新しました");
      setFormState({ instagram: "", tiktok: "" });
      fetchCastDetail();
    } catch (err) {
      const message = err instanceof Error ? err.message : "更新に失敗しました";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSocialError(null);
    setSocialMessage(null);

    if (!castId) {
      setSocialError("cast_id が不明です");
      return;
    }

    if (!socialForm.url) {
      setSocialError("URL を入力してください");
      return;
    }

    try {
      new URL(socialForm.url);
    } catch {
      setSocialError("有効な URL を入力してください");
      return;
    }

    setIsSocialSubmitting(true);

    try {
      const response = await fetch(`/api/admin/casts/${castId}/social-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          platform: socialForm.platform,
          url: socialForm.url,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "SNS リンクの保存に失敗しました");
      }

      setSocialMessage("SNS リンクを保存しました");
      setSocialForm((prev) => ({ ...prev, url: "" }));
      fetchCastDetail();
    } catch (err) {
      const message = err instanceof Error ? err.message : "SNS リンクの保存に失敗しました";
      setSocialError(message);
    } finally {
      setIsSocialSubmitting(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!castId) {
      setSocialError("cast_id が不明です");
      return;
    }
    setSocialError(null);
    setSocialMessage(null);
    setDeletingLinkId(linkId);

    try {
      const response = await fetch(`/api/admin/casts/${castId}/social-links?linkId=${linkId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "SNS リンクの削除に失敗しました");
      }

      setSocialMessage("SNS リンクを削除しました");
      fetchCastDetail();
    } catch (err) {
      const message = err instanceof Error ? err.message : "SNS リンクの削除に失敗しました";
      setSocialError(message);
    } finally {
      setDeletingLinkId(null);
    }
  };

  if (isChecking) {
    return <AdminLoading />;
  }

  if (!isAuthenticated) {
    return <AdminLoading message="認証リダイレクト中" />;
  }

  return (
    <PageFrame mainClassName="gap-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
                キャスト一覧
              </Link>
              <Link
                href="/admin"
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              >
                /admin
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">SNS フォロワー数を更新</h2>
            {cast?.name && <p className="text-sm text-white/70">対象キャスト: {cast.name}</p>}
          </div>
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
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">SNS リンクを登録</h2>
            <p className="text-sm text-white/70"></p>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSocialSubmit}>
            <label className="block text-sm text-white/70">
              プラットフォーム
              <select
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                value={socialForm.platform}
                onChange={(event) =>
                  setSocialForm((prev) => ({ ...prev, platform: event.target.value as SocialPlatform }))
                }
              >
                {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-white/70">
              URL
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                value={socialForm.url}
                onChange={(event) => setSocialForm((prev) => ({ ...prev, url: event.target.value }))}
                placeholder="https://instagram.com/example"
              />
            </label>

            {socialError && (
              <p className="rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm text-red-100">
                {socialError}
              </p>
            )}
            {socialMessage && (
              <p className="rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
                {socialMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 px-4 py-3 text-base font-semibold shadow-lg shadow-indigo-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSocialSubmitting}
            >
              {isSocialSubmitting ? "保存中..." : "SNS リンクを保存"}
            </button>
          </form>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">登録済みリンク</h3>
            {socialLinks.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
                まだ登録されていません。
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {socialLinks.map((link) => (
                  <li
                    key={link.id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm text-white/60">{getPlatformLabel(link.platform)}</p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-base text-white/90 underline-offset-4 hover:underline"
                      >
                        {link.url}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(link.id)}
                      className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={deletingLinkId === link.id}
                    >
                      {deletingLinkId === link.id ? "削除中..." : "削除"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold">履歴</h2>
          {detailError && (
            <p className="mt-4 rounded-xl border border-yellow-500/60 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-100">
              {detailError}
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
      <AdminFooter onLogout={logout} />
    </PageFrame>
  );
}

const getPlatformLabel = (value: string) => {
  const option = SOCIAL_PLATFORM_OPTIONS.find((platform) => platform.value === value);
  return option ? option.label : value;
};

const AdminLoading = ({ message = "読み込み中" }: { message?: string }) => (
  <PageFrame mainClassName="flex min-h-[320px] items-center justify-center">
    <p className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/80">{message}</p>
  </PageFrame>
);
