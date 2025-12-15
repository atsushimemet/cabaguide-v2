import { getServiceSupabaseClient } from "@/lib/supabaseServer";

const formatJapaneseDate = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
};

export const getRankingLastUpdatedLabel = async (): Promise<string | null> => {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("cast_follower_snapshots")
    .select("captured_at")
    .order("captured_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const latest = ((data ?? [])[0] as { captured_at?: string } | undefined)?.captured_at;
  if (!latest) {
    return null;
  }

  const parsed = new Date(latest);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }

  return formatJapaneseDate(parsed);
};
