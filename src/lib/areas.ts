import { areas } from "@/data/areas";
import { Area } from "@/types/area";

export type PrefectureGroup = {
  prefecture: string;
  downtowns: Area[];
};

export const groupAreasByPrefecture = (): PrefectureGroup[] => {
  const map = new Map<string, Area[]>();

  areas.forEach((area) => {
    const current = map.get(area.todofukenName) ?? [];
    current.push(area);
    map.set(area.todofukenName, current);
  });

  return Array.from(map.entries()).map(([prefecture, downtowns]) => ({
    prefecture,
    downtowns: [...downtowns].sort((a, b) =>
      a.downtownName.localeCompare(b.downtownName, "ja")
    ),
  }));
};

export const findDowntownsByPrefecture = (prefectureName: string): Area[] => {
  return (
    groupAreasByPrefecture().find((group) => group.prefecture === prefectureName)
      ?.downtowns ?? []
  );
};

export const getPrefectureList = (): string[] => {
  return Array.from(new Set(areas.map((area) => area.todofukenName))).sort(
    (a, b) => a.localeCompare(b, "ja")
  );
};

export const getAreaById = (id: number): Area | undefined => {
  return areas.find((area) => area.id === id);
};
