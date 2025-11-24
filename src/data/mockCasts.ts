import { areas } from "@/data/areas";
import { getStoresByDowntownId } from "@/data/mockStores";
import { Cast } from "@/types/cast";
import { Store } from "@/types/store";

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

const createCast = (
  areaId: number,
  prefecture: string,
  downtownName: string,
  store: Store,
  index: number
): Cast => {
  const accent = accentPalette[(areaId + index) % accentPalette.length];
  const number = index + 1;
  const id = `${areaId}-${number}`;

  return {
    id,
    downtownId: areaId,
    prefecture,
    downtownName,
    name: `${downtownName} ${number}号`,
    followers: 12000 + number * 230,
    storeId: store.id,
    storeName: store.name,
    image: placeholderImage,
    castLink: `/casts/${areaId}/${id}`,
    storeLink: store.googleMapLink,
    accent,
    badgeText: `${downtownName}`,
  };
};

const castsByDowntownId: Record<number, Cast[]> = {};

areas.forEach((area) => {
  const stores = getStoresByDowntownId(area.id);
  castsByDowntownId[area.id] = Array.from({ length: 31 }).map((_, index) => {
    const store = stores[index % stores.length];
    return createCast(area.id, area.todofukenName, area.downtownName, store, index);
  });
});

export const getCastsByDowntownId = (downtownId: number): Cast[] => {
  return castsByDowntownId[downtownId] ?? [];
};

export const findCastByDowntownAndId = (downtownId: number, castId: string): Cast | undefined => {
  return getCastsByDowntownId(downtownId).find((cast) => cast.id === castId);
};
