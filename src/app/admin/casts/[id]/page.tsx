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

type StoreOption = {
  id: string;
  name: string;
  areaId?: number | null;
  todofukenName?: string | null;
  downtownName?: string | null;
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameUpdateStatus, setNameUpdateStatus] = useState<string | null>(null);
  const [nameUpdateError, setNameUpdateError] = useState<string | null>(null);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);
  const [storeOptionsError, setStoreOptionsError] = useState<string | null>(null);
  const [isStoreOptionsLoading, setIsStoreOptionsLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [isUpdatingStore, setIsUpdatingStore] = useState(false);
  const [storeUpdateStatus, setStoreUpdateStatus] = useState<string | null>(null);
  const [storeUpdateError, setStoreUpdateError] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingLinkForm, setEditingLinkForm] = useState<{ platform: SocialPlatform; url: string }>({
    platform: SOCIAL_PLATFORM_OPTIONS[0].value,
    url: "",
  });
  const [isUpdatingLink, setIsUpdatingLink] = useState(false);
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [snapshotInputValue, setSnapshotInputValue] = useState("");
  const [snapshotStatus, setSnapshotStatus] = useState<string | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [isUpdatingSnapshot, setIsUpdatingSnapshot] = useState(false);
  const [deletingSnapshotId, setDeletingSnapshotId] = useState<string | null>(null);
  const [ageInput, setAgeInput] = useState("");
  const [ageUpdateStatus, setAgeUpdateStatus] = useState<string | null>(null);
  const [ageUpdateError, setAgeUpdateError] = useState<string | null>(null);
  const [isUpdatingAge, setIsUpdatingAge] = useState(false);

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

  useEffect(() => {
    setNameInput(cast?.name ?? "");
  }, [cast?.name]);

  useEffect(() => {
    setSelectedStoreId(cast?.store_id ?? "");
  }, [cast?.store_id]);

  useEffect(() => {
    setAgeInput(
      cast?.age != null && Number.isFinite(cast.age) ? String(cast.age) : ""
    );
  }, [cast?.age]);

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

  const handleStartNameEdit = () => {
    if (!cast) {
      return;
    }
    setNameInput(cast.name);
    setIsEditingName(true);
    setNameUpdateError(null);
    setNameUpdateStatus(null);
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setNameInput(cast?.name ?? "");
    setNameUpdateError(null);
  };

  const handleNameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!castId) {
      setNameUpdateError("cast_id が不明です");
      return;
    }
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameUpdateError("キャスト名を入力してください");
      return;
    }

    setIsUpdatingName(true);
    setNameUpdateError(null);
    setNameUpdateStatus(null);

    try {
      const response = await fetch(`/api/admin/casts/${castId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "キャスト名の更新に失敗しました");
      }

      setNameUpdateStatus("キャスト名を更新しました");
      setIsEditingName(false);
      setCast((prev) => (prev ? { ...prev, name: trimmed } : prev));
      fetchCastDetail();
    } catch (err) {
      const message = err instanceof Error ? err.message : "キャスト名の更新に失敗しました";
      setNameUpdateError(message);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleAgeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!castId) {
      setAgeUpdateError("cast_id が不明です");
      return;
    }

    const trimmed = ageInput.trim();
    let ageValue: number | null = null;
    if (trimmed) {
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setAgeUpdateError("年齢は0以上の数値で入力してください");
        return;
      }
      ageValue = Math.floor(parsed);
    }

    setIsUpdatingAge(true);
    setAgeUpdateError(null);
    setAgeUpdateStatus(null);

    try {
      const response = await fetch(`/api/admin/casts/${castId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ age: ageValue }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "年齢の更新に失敗しました");
      }

      setAgeUpdateStatus("年齢を更新しました");
      setCast((prev) => (prev ? { ...prev, age: ageValue ?? null } : prev));
      fetchCastDetail();
    } catch (error) {
      const message = error instanceof Error ? error.message : "年齢の更新に失敗しました";
      setAgeUpdateError(message);
    } finally {
      setIsUpdatingAge(false);
    }
  };

  const fetchStoreOptions = useCallback(async () => {
    setIsStoreOptionsLoading(true);
    setStoreOptionsError(null);
    try {
      const response = await fetch("/api/admin/store-options", { credentials: "include" });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "店舗一覧の取得に失敗しました");
      }

      const storesPayload = Array.isArray(payload?.stores) ? (payload.stores as StoreOption[]) : [];
      setStoreOptions(storesPayload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "店舗一覧の取得に失敗しました";
      setStoreOptions([]);
      setStoreOptionsError(message);
    } finally {
      setIsStoreOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoreOptions();
  }, [fetchStoreOptions]);

  const handleStoreSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStoreUpdateError(null);
    setStoreUpdateStatus(null);
    if (!castId) {
      setStoreUpdateError("cast_id が不明です");
      return;
    }
    if (!selectedStoreId) {
      setStoreUpdateError("店舗を選択してください");
      return;
    }
    if (selectedStoreId === cast?.store_id) {
      setStoreUpdateError("変更する店舗を選択してください");
      return;
    }

    setIsUpdatingStore(true);
    try {
      const response = await fetch(`/api/admin/casts/${castId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ storeId: selectedStoreId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "店舗の更新に失敗しました");
      }

      setStoreUpdateStatus("所属店舗を更新しました");
      fetchCastDetail();
    } catch (err) {
      const message = err instanceof Error ? err.message : "店舗の更新に失敗しました";
      setStoreUpdateError(message);
    } finally {
      setIsUpdatingStore(false);
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

  const handleStartLinkEdit = (link: SocialLink) => {
    setEditingLinkId(link.id);
    setEditingLinkForm({
      platform: (SOCIAL_PLATFORM_OPTIONS.find((option) => option.value === link.platform)?.value ??
        SOCIAL_PLATFORM_OPTIONS[0].value) as SocialPlatform,
      url: link.url,
    });
    setSocialError(null);
    setSocialMessage(null);
  };

  const handleCancelLinkEdit = () => {
    setEditingLinkId(null);
    setEditingLinkForm((prev) => ({ ...prev, url: "" }));
    setIsUpdatingLink(false);
  };

  const handleLinkUpdate = async (event: FormEvent<HTMLFormElement>, linkId: string) => {
    event.preventDefault();
    if (!castId) {
      setSocialError("cast_id が不明です");
      return;
    }
    if (!editingLinkForm.url) {
      setSocialError("URL を入力してください");
      return;
    }

    try {
      new URL(editingLinkForm.url);
    } catch {
      setSocialError("有効な URL を入力してください");
      return;
    }

    setIsUpdatingLink(true);
    setSocialError(null);
    setSocialMessage(null);

    try {
      const response = await fetch(`/api/admin/casts/${castId}/social-links?linkId=${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          platform: editingLinkForm.platform,
          url: editingLinkForm.url,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "SNS リンクの更新に失敗しました");
      }

      setSocialMessage("SNS リンクを更新しました");
      setEditingLinkId(null);
      setEditingLinkForm((prev) => ({ ...prev, url: "" }));
      fetchCastDetail();
    } catch (err) {
      const message = err instanceof Error ? err.message : "SNS リンクの更新に失敗しました";
      setSocialError(message);
    } finally {
      setIsUpdatingLink(false);
    }
  };

  const handleStartSnapshotEdit = (snapshot: SnapshotRow) => {
    setEditingSnapshotId(snapshot.id);
    setSnapshotInputValue(String(snapshot.followers));
    setSnapshotError(null);
    setSnapshotStatus(null);
  };

  const handleCancelSnapshotEdit = () => {
    setEditingSnapshotId(null);
    setSnapshotInputValue("");
    setSnapshotError(null);
  };

  const handleSnapshotUpdate = async (event: FormEvent<HTMLFormElement>, snapshotId: string) => {
    event.preventDefault();
    if (!castId) {
      setSnapshotError("cast_id が不明です");
      return;
    }

    const value = Number(snapshotInputValue);
    if (!Number.isFinite(value) || value < 0) {
      setSnapshotError("フォロワー数は0以上の数値で入力してください");
      return;
    }

    setIsUpdatingSnapshot(true);
    setSnapshotError(null);
    setSnapshotStatus(null);
    try {
      const response = await fetch(`/api/admin/casts/${castId}/followers?snapshotId=${snapshotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ followers: value }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "フォロワー履歴の更新に失敗しました");
      }

      setSnapshotStatus("フォロワー履歴を更新しました");
      setEditingSnapshotId(null);
      setSnapshotInputValue("");
      fetchCastDetail();
    } catch (err) {
      const message = err instanceof Error ? err.message : "フォロワー履歴の更新に失敗しました";
      setSnapshotError(message);
    } finally {
      setIsUpdatingSnapshot(false);
    }
  };

  const handleSnapshotDelete = async (snapshotId: string) => {
    if (!castId) {
      setSnapshotError("cast_id が不明です");
      return;
    }
    setDeletingSnapshotId(snapshotId);
    setSnapshotError(null);
    setSnapshotStatus(null);

    try {
      const response = await fetch(`/api/admin/casts/${castId}/followers?snapshotId=${snapshotId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "フォロワー履歴の削除に失敗しました");
      }

      setSnapshotStatus("フォロワー履歴を削除しました");
      fetchCastDetail();
    } catch (err) {
      const message = err instanceof Error ? err.message : "フォロワー履歴の削除に失敗しました";
      setSnapshotError(message);
    } finally {
      setDeletingSnapshotId(null);
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
              {isEditingName ? (
                <form className="mt-2 space-y-3" onSubmit={handleNameSubmit}>
                  <label className="block text-sm text-white/70">
                    キャスト名を編集
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                      value={nameInput}
                      onChange={(event) => setNameInput(event.target.value)}
                      placeholder="キャスト名"
                    />
                  </label>
                  {nameUpdateError && (
                    <p className="text-sm text-red-300">{nameUpdateError}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white"
                      disabled={isUpdatingName}
                    >
                      {isUpdatingName ? "更新中..." : "保存"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelNameEdit}
                      className="rounded-full border border-white/30 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                      disabled={isUpdatingName}
                    >
                      キャンセル
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={cast ? handleStartNameEdit : undefined}
                    className="text-left"
                    disabled={!cast}
                  >
                    <h1 className="text-2xl font-semibold text-white transition hover:text-indigo-200">
                      {cast?.name ?? "キャスト詳細"}
                    </h1>
                    {cast && (
                      <p className="text-xs text-white/60">キャスト名をクリックして編集</p>
                    )}
                  </button>
                  {nameUpdateStatus && (
                    <p className="mt-2 text-sm text-emerald-200">{nameUpdateStatus}</p>
                  )}
                  {nameUpdateError && !cast && (
                    <p className="mt-2 text-sm text-red-300">{nameUpdateError}</p>
                  )}
                </>
              )}
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
            <h2 className="text-xl font-semibold">所属店舗を更新</h2>
            {store && <p className="text-sm text-white/70">現在の店舗: {store.name}</p>}
          </div>
          {storeOptionsError && (
            <p className="mt-3 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm text-red-100">
              {storeOptionsError}
            </p>
          )}
          <form className="mt-4 space-y-4" onSubmit={handleStoreSubmit}>
            <label className="block text-sm text-white/70">
              店舗を選択
              <select
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                value={selectedStoreId}
                onChange={(event) => {
                  setSelectedStoreId(event.target.value);
                  setStoreUpdateError(null);
                  setStoreUpdateStatus(null);
                }}
                disabled={isStoreOptionsLoading}
              >
                <option value="">店舗を選択してください</option>
                {storeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {formatStoreOptionLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            {storeUpdateError && (
              <p className="rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm text-red-100">
                {storeUpdateError}
              </p>
            )}
            {storeUpdateStatus && (
              <p className="rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
                {storeUpdateStatus}
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 px-4 py-3 text-base font-semibold shadow-lg shadow-indigo-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isUpdatingStore || isStoreOptionsLoading}
            >
              {isUpdatingStore ? "更新中..." : "所属店舗を保存"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">年齢を更新</h2>
            <p className="text-sm text-white/70">
              現在の登録: {cast?.age != null ? `${cast.age}歳` : "未設定"}
            </p>
          </div>
          {ageUpdateError && (
            <p className="mt-3 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm text-red-100">
              {ageUpdateError}
            </p>
          )}
          {ageUpdateStatus && (
            <p className="mt-3 rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
              {ageUpdateStatus}
            </p>
          )}
          <form className="mt-4 space-y-4" onSubmit={handleAgeSubmit}>
            <label className="block text-sm text-white/70">
              年齢
              <input
                type="number"
                min={0}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                value={ageInput}
                onChange={(event) => setAgeInput(event.target.value)}
                placeholder="例: 24"
              />
              <span className="mt-1 block text-xs text-white/50">空にすると未設定に戻ります</span>
            </label>
            <button
              type="submit"
              className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isUpdatingAge}
            >
              {isUpdatingAge ? "更新中..." : "年齢を保存"}
            </button>
          </form>
        </section>

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
                  <li key={link.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    {editingLinkId === link.id ? (
                      <form className="space-y-4" onSubmit={(event) => handleLinkUpdate(event, link.id)}>
                        <label className="block text-sm text-white/70">
                          プラットフォーム
                          <select
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                            value={editingLinkForm.platform}
                            onChange={(event) =>
                              setEditingLinkForm((prev) => ({
                                ...prev,
                                platform: event.target.value as SocialPlatform,
                              }))
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
                            value={editingLinkForm.url}
                            onChange={(event) =>
                              setEditingLinkForm((prev) => ({ ...prev, url: event.target.value }))
                            }
                            placeholder="https://instagram.com/example"
                          />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isUpdatingLink}
                          >
                            {isUpdatingLink ? "更新中..." : "保存"}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelLinkEdit}
                            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isUpdatingLink}
                          >
                            キャンセル
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartLinkEdit(link)}
                            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLink(link.id)}
                            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={deletingLinkId === link.id}
                          >
                            {deletingLinkId === link.id ? "削除中..." : "削除"}
                          </button>
                        </div>
                      </div>
                    )}
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
          {snapshotError && (
            <p className="mt-3 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm text-red-100">
              {snapshotError}
            </p>
          )}
          {snapshotStatus && (
            <p className="mt-3 rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
              {snapshotStatus}
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
                  {editingSnapshotId === snapshot.id ? (
                    <form className="space-y-3" onSubmit={(event) => handleSnapshotUpdate(event, snapshot.id)}>
                      <p className="text-sm text-white/60">{getPlatformLabel(snapshot.platform)}</p>
                      <label className="block text-sm text-white/70">
                        フォロワー数
                        <input
                          type="number"
                          min="0"
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                          value={snapshotInputValue}
                          onChange={(event) => setSnapshotInputValue(event.target.value)}
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isUpdatingSnapshot}
                        >
                          {isUpdatingSnapshot ? "更新中..." : "保存"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelSnapshotEdit}
                          className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isUpdatingSnapshot}
                        >
                          キャンセル
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{getPlatformLabel(snapshot.platform)}</span>
                        <span className="text-white">{snapshot.followers.toLocaleString()} 人</span>
                      </div>
                      <p className="text-xs text-white/50">
                        {new Date(snapshot.captured_at).toLocaleString("ja-JP")}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartSnapshotEdit(snapshot)}
                          className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/80 transition hover:bg-white/10"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSnapshotDelete(snapshot.id)}
                          className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={deletingSnapshotId === snapshot.id}
                        >
                          {deletingSnapshotId === snapshot.id ? "削除中..." : "削除"}
                        </button>
                      </div>
                    </>
                  )}
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

const formatStoreOptionLabel = (option: StoreOption) => {
  const area = [option.todofukenName, option.downtownName].filter(Boolean).join(" ");
  return area ? `${area} ${option.name}` : option.name;
};

const AdminLoading = ({ message = "読み込み中" }: { message?: string }) => (
  <PageFrame mainClassName="flex min-h-[320px] items-center justify-center">
    <p className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/80">{message}</p>
  </PageFrame>
);
