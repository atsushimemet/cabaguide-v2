import { getAreaById } from "@/lib/areas";
import { getServiceSupabaseClient } from "@/lib/supabaseServer";
import { getStoreById } from "@/lib/stores";
import { Cast } from "@/types/cast";
import { CastFollowerSnapshot, CastSNS, SNSPlatform } from "@/types/castProfile";
import { Store } from "@/types/store";

export type CastDetail = {
  cast: Cast;
  store: Store;
  sns: CastSNS[];
  followerSnapshots: CastFollowerSnapshot[];
};

type SocialLinkRow = {
  platform: string;
  url: string;
};

type SnapshotRow = {
  platform: string;
  followers: number;
  captured_at: string;
};

const PLACEHOLDER_IMAGE = "/images/top-casts/placeholder.svg";
const DEFAULT_ACCENT = "#f472b6";

const toSnapshot = (castId: string, row: SnapshotRow): CastFollowerSnapshot | null => {
  if (row.platform !== "instagram" && row.platform !== "tiktok") {
    return null;
  }

  return {
    castId,
    platform: row.platform,
    followers: row.followers,
    capturedAt: row.captured_at,
  };
};

const toSocialLink = (castId: string, row: SocialLinkRow): CastSNS | null => {
  if (row.platform !== "instagram" && row.platform !== "tiktok") {
    return null;
  }

  return {
    castId,
    platform: row.platform,
    url: row.url,
    handle: row.url,
  };
};

export const getCastDetail = async (downtownId: number, castId: string): Promise<CastDetail | null> => {
  if (!castId) {
    return null;
  }

  const supabase = getServiceSupabaseClient();
  const { data: castRow, error: castError } = await supabase
    .from("casts")
    .select("id, name, image_url, store_id")
    .eq("id", castId)
    .single();

  if (castError) {
    throw new Error(castError.message);
  }

  if (!castRow) {
    return null;
  }

  const store = await getStoreById(castRow.store_id);
  if (!store || store.areaId !== downtownId) {
    return null;
  }

  const area = getAreaById(store.areaId);
  if (!area) {
    return null;
  }

  const { data: socialRows, error: socialError } = await supabase
    .from("cast_social_links")
    .select("platform, url")
    .eq("cast_id", castId)
    .order("created_at", { ascending: false });

  if (socialError) {
    throw new Error(socialError.message);
  }

  const sns =
    (socialRows ?? [])
      .map((row) => toSocialLink(castId, row as SocialLinkRow))
      .filter((value): value is CastSNS => Boolean(value)) ?? [];

  const { data: snapshotRows, error: snapshotError } = await supabase
    .from("cast_follower_snapshots")
    .select("platform, followers, captured_at")
    .eq("cast_id", castId)
    .order("captured_at", { ascending: true });

  if (snapshotError) {
    throw new Error(snapshotError.message);
  }

  const followerSnapshots =
    (snapshotRows ?? [])
      .map((row) => toSnapshot(castId, row as SnapshotRow))
      .filter((value): value is CastFollowerSnapshot => Boolean(value)) ?? [];

  const latestFollowers = getLatestFollowers(followerSnapshots);
  const totalFollowers =
    (latestFollowers.instagram?.followers ?? 0) + (latestFollowers.tiktok?.followers ?? 0);

  const cast: Cast = {
    id: castRow.id,
    downtownId: store.areaId,
    prefecture: area.todofukenName,
    downtownName: area.downtownName,
    name: castRow.name,
    followers: totalFollowers,
    storeId: store.id,
    storeName: store.name,
    image: castRow.image_url ?? PLACEHOLDER_IMAGE,
    castLink: `/casts/${store.areaId}/${castRow.id}`,
    storeLink: store.googleMapLink,
    accent: DEFAULT_ACCENT,
    badgeText: area.downtownName,
  };

  return {
    cast,
    store,
    sns,
    followerSnapshots,
  };
};

export const getLatestFollowers = (
  snapshots: CastFollowerSnapshot[]
): Record<SNSPlatform, { followers: number; capturedAt: string }> => {
  return snapshots.reduce((acc, snapshot) => {
    const current = acc[snapshot.platform];
    if (!current || new Date(snapshot.capturedAt) > new Date(current.capturedAt)) {
      acc[snapshot.platform] = {
        followers: snapshot.followers,
        capturedAt: snapshot.capturedAt,
      };
    }
    return acc;
  }, {} as Record<SNSPlatform, { followers: number; capturedAt: string }>);
};
