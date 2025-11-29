import { areas } from "@/data/areas";
import { Store, StoreTimeSlotPricing } from "@/types/store";

export const AVAILABLE_TIME_SLOTS = ["20:00", "21:00", "22:00", "23:00", "24:00"] as const;
const STORES_PER_AREA = 3;

const stores: Store[] = [];
const storesByDowntown: Record<number, Store[]> = {};
const storesBySlug = new Map<string, Store>();

const createTimeSlots = (areaId: number, storeIndex: number): StoreTimeSlotPricing[] => {
  const basePrice = 9000 + (areaId % 5) * 600 + storeIndex * 400;

  return AVAILABLE_TIME_SLOTS.map((slot, slotIndex) => {
    const mainPrice = basePrice + slotIndex * 1200;
    return {
      timeSlot: slot,
      mainPrice,
      vipPrice: mainPrice + 4000,
    };
  });
};

const toSlug = (value: string, fallback: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
};

const createStore = (areaId: number, downtownName: string, storeIndex: number): Store => {
  const suffix = String.fromCharCode("A".charCodeAt(0) + storeIndex);
  const id = `store-${areaId}-${storeIndex + 1}`;
  const slugSource = `${downtownName}-${suffix}-${id}`;
  const slug = toSlug(slugSource, id);

  return {
    id,
    slug,
    areaId,
    name: `${downtownName} CLUB ${suffix}`,
    googleMapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${downtownName} CLUB ${suffix}`
    )}`,
    phone: `03-6${areaId.toString().padStart(2, "0")}-${(7000 + storeIndex * 137)
      .toString()
      .padStart(4, "0")}`,
    basePricing: {
      nominationPrice: 3000 + storeIndex * 500,
      serviceFeeRate: 0.2 + (areaId % 3) * 0.02,
      taxRate: 0.1,
      extensionPrice: 6000 + storeIndex * 1000,
      lightDrinkPrice: 2000 + storeIndex * 200,
      cheapestChampagnePrice: 18000 + areaId * 200,
    },
    timeSlots: createTimeSlots(areaId, storeIndex),
  };
};

areas.forEach((area) => {
  const areaStores = Array.from({ length: STORES_PER_AREA }).map((_, index) =>
    createStore(area.id, area.downtownName, index)
  );
  storesByDowntown[area.id] = areaStores;
  stores.push(...areaStores);
  areaStores.forEach((store) => {
    storesBySlug.set(store.slug, store);
  });
});

export const getStoresByDowntownId = (downtownId: number): Store[] => {
  return storesByDowntown[downtownId] ?? [];
};

export const getStoreById = (storeId: string): Store | undefined => {
  return stores.find((store) => store.id === storeId);
};

export const getStoreBySlug = (slug: string): Store | undefined => {
  return storesBySlug.get(slug);
};
