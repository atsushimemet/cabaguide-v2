import { SupabaseClient } from "@supabase/supabase-js";

type FollowersRow = {
  cast_id: string;
  platform: string;
  followers: number;
  captured_at: string;
};

type TimestampedFollowers = {
  followers: number;
  captured_at: string;
};

export type FollowersByPlatform = {
  instagram?: number;
  tiktok?: number;
};

export type FollowersMap = Record<string, FollowersByPlatform>;

const FOLLOWER_CHUNK_SIZE = 50;

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  if (chunkSize <= 0) {
    return [items];
  }
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

const trackLatestFollowers = (rows: FollowersRow[]): Record<string, Record<string, TimestampedFollowers>> => {
  const latest: Record<string, Record<string, TimestampedFollowers>> = {};
  for (const row of rows) {
    if (row.platform !== "instagram" && row.platform !== "tiktok") {
      continue;
    }
    if (!latest[row.cast_id]) {
      latest[row.cast_id] = {};
    }

    const current = latest[row.cast_id][row.platform];
    const nextTimestamp = new Date(row.captured_at).getTime();
    const currentTimestamp = current ? new Date(current.captured_at).getTime() : Number.NEGATIVE_INFINITY;

    if (!current || nextTimestamp > currentTimestamp) {
      latest[row.cast_id][row.platform] = {
        followers: row.followers,
        captured_at: row.captured_at,
      };
    }
  }
  return latest;
};

export const fetchLatestFollowersByCastIds = async (
  supabase: SupabaseClient,
  castIds: string[],
  chunkSize: number = FOLLOWER_CHUNK_SIZE
): Promise<FollowersMap> => {
  if (castIds.length === 0) {
    return {};
  }

  const batches = chunkArray(castIds, Math.max(1, chunkSize));

  const snapshotBatches = await Promise.all(
    batches.map(async (batch) => {
      const { data, error } = await supabase
        .from("cast_follower_snapshots")
        .select("cast_id, platform, followers, captured_at")
        .in("cast_id", batch)
        .order("captured_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as FollowersRow[];
    })
  );

  const latestRows: Record<string, Record<string, TimestampedFollowers>> = {};
  for (const rows of snapshotBatches) {
    const latestFromBatch = trackLatestFollowers(rows);
    for (const [castId, platforms] of Object.entries(latestFromBatch)) {
      if (!latestRows[castId]) {
        latestRows[castId] = {};
      }

      Object.entries(platforms).forEach(([platform, snapshot]) => {
        const current = latestRows[castId][platform];
        const nextTimestamp = new Date(snapshot.captured_at).getTime();
        const currentTimestamp = current
          ? new Date(current.captured_at).getTime()
          : Number.NEGATIVE_INFINITY;

        if (!current || nextTimestamp > currentTimestamp) {
          latestRows[castId][platform] = snapshot;
        }
      });
    }
  }

  const followersMap: FollowersMap = {};
  for (const [castId, platforms] of Object.entries(latestRows)) {
    followersMap[castId] = {
      instagram: platforms.instagram?.followers,
      tiktok: platforms.tiktok?.followers,
    };
  }

  return followersMap;
};
