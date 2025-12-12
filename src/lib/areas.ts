import { cache } from "react";

import { getServiceSupabaseClient } from "@/lib/supabaseServer";
import { Area } from "@/types/area";

type AreaRow = {
  id: number;
  todofuken_name: string;
  downtown_name: string;
};

export type PrefectureGroup = {
  prefecture: string;
  downtowns: Area[];
};

const fetchAreas = cache(async (): Promise<Area[]> => {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("areas")
    .select("id, todofuken_name, downtown_name")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const typed = row as AreaRow;
    return {
      id: typed.id,
      todofukenName: typed.todofuken_name,
      downtownName: typed.downtown_name,
    };
  });
});

const fetchAreaGroups = cache(async (): Promise<Map<string, Area[]>> => {
  const areaList = await fetchAreas();
  const map = new Map<string, Area[]>();
  areaList.forEach((area) => {
    const current = map.get(area.todofukenName) ?? [];
    current.push(area);
    map.set(area.todofukenName, current);
  });
  return map;
});

export const getAreaMap = cache(async (): Promise<Map<number, Area>> => {
  const areaList = await fetchAreas();
  const map = new Map<number, Area>();
  areaList.forEach((area) => {
    map.set(area.id, area);
  });
  return map;
});

export const groupAreasByPrefecture = async (): Promise<PrefectureGroup[]> => {
  const map = await fetchAreaGroups();
  return Array.from(map.entries()).map(([prefecture, downtowns]) => ({
    prefecture,
    downtowns: [...downtowns].sort((a, b) =>
      a.downtownName.localeCompare(b.downtownName, "ja")
    ),
  }));
};

export const findDowntownsByPrefecture = async (prefectureName: string): Promise<Area[]> => {
  const map = await fetchAreaGroups();
  return (
    map
      .get(prefectureName)
      ?.slice()
      .sort((a, b) => a.downtownName.localeCompare(b.downtownName, "ja")) ?? []
  );
};

export const getPrefectureList = async (): Promise<string[]> => {
  const areas = await fetchAreas();
  return Array.from(new Set(areas.map((area) => area.todofukenName))).sort((a, b) =>
    a.localeCompare(b, "ja")
  );
};

export const getAreaById = async (id: number): Promise<Area | undefined> => {
  const map = await getAreaMap();
  return map.get(id);
};
