import { areas } from "@/data/areas";
import { Cast } from "@/types/cast";

const accentPalette = [
  "#f472b6",
  "#c084fc",
  "#a5b4fc",
  "#67e8f9",
  "#fda4af",
  "#f0abfc",
  "#bef264",
  "#f9a8d4",
  "#a78bfa",
  "#7dd3fc",
];

const placeholderImage = "/images/top-casts/placeholder.svg";

const createCast = (areaId: number, prefecture: string, downtownName: string, index: number): Cast => {
  const accent = accentPalette[(areaId + index) % accentPalette.length];
  const number = index + 1;

  return {
    id: `${areaId}-${number}`,
    prefecture,
    downtownName,
    name: `${downtownName} ${number}号`,
    followers: 12000 + number * 230,
    storeName: `${downtownName} CLUB ${String.fromCharCode(64 + ((number % 26) || 26))}`,
    image: placeholderImage,
    castLink: `#cast-${areaId}-${number}`,
    storeLink: `#store-${areaId}-${number}`,
    accent,
    badgeText: `${downtownName}`,
  };
};

const castsByDowntownId: Record<number, Cast[]> = {};

areas.forEach((area) => {
  castsByDowntownId[area.id] = Array.from({ length: 31 }).map((_, index) =>
    createCast(area.id, area.todofukenName, area.downtownName, index)
  );
});

export const getCastsByDowntownId = (downtownId: number): Cast[] => {
  return castsByDowntownId[downtownId] ?? [];
};
