import { AVAILABLE_TIME_SLOTS, getStoreById } from "@/data/mockStores";
import { topCasts } from "@/data/topCasts";
import { getCastSummary } from "@/lib/casts";
import { Cast } from "@/types/cast";
import { CastFollowerSnapshot, CastSNS, SNSPlatform } from "@/types/castProfile";
import { Store } from "@/types/store";

export type CastDetail = {
  cast: Cast;
  store: Store;
  sns: CastSNS[];
  followerSnapshots: CastFollowerSnapshot[];
};

const snsMap = new Map<string, CastSNS[]>();
const followerMap = new Map<string, CastFollowerSnapshot[]>();

const createHandleSlug = (cast: Cast) => {
  return `${cast.downtownName}-${cast.id}`.replace(/\s+/g, "").toLowerCase();
};

const createSNSRecords = (cast: Cast): CastSNS[] => {
  const slug = createHandleSlug(cast);

  return [
    {
      castId: cast.id,
      platform: "instagram",
      url: `https://www.instagram.com/${slug}/`,
      handle: `@${slug}`,
    },
    {
      castId: cast.id,
      platform: "tiktok",
      url: `https://www.tiktok.com/@${slug}`,
      handle: `@${slug}`,
    },
  ];
};

const createFollowerSnapshots = (cast: Cast): CastFollowerSnapshot[] => {
  const instagramLatest = Math.max(1000, Math.round(cast.followers * 0.6));
  const tiktokLatest = Math.max(800, cast.followers - instagramLatest);

  const snapshotDates = ["2024-05-01", "2024-06-01", "2024-07-01"];

  const createPlatformSnapshots = (platform: SNSPlatform, latest: number) => {
    return snapshotDates.map((capturedAt, index) => ({
      castId: cast.id,
      platform,
      capturedAt,
      followers: Math.max(500, Math.round(latest * (0.8 + index * 0.1))),
    }));
  };

  return [...createPlatformSnapshots("instagram", instagramLatest), ...createPlatformSnapshots("tiktok", tiktokLatest)];
};

const ensureProfileData = (cast: Cast) => {
  if (!snsMap.has(cast.id)) {
    snsMap.set(cast.id, createSNSRecords(cast));
  }

  if (!followerMap.has(cast.id)) {
    followerMap.set(cast.id, createFollowerSnapshots(cast));
  }

  return {
    sns: snsMap.get(cast.id)!,
    followerSnapshots: followerMap.get(cast.id)!,
  };
};

export const getCastDetail = (downtownId: number, castId: string): CastDetail | undefined => {
  const cast =
    getCastSummary(downtownId, castId) ??
    topCasts.find((entry) => entry.id === castId && entry.downtownId === downtownId);

  if (!cast) {
    return undefined;
  }

  const store = getStoreById(cast.storeId);

  if (!store) {
    return undefined;
  }

  const { sns, followerSnapshots } = ensureProfileData(cast);

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

export const getAvailableTimeSlots = () => [...AVAILABLE_TIME_SLOTS];
