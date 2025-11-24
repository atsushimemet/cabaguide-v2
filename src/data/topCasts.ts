import { getStoreById } from "@/data/mockStores";
import { Cast } from "@/types/cast";

const PLACEHOLDER_IMAGE = "/images/top-casts/placeholder.svg";

type FeaturedCastConfig = {
  id: string;
  downtownId: number;
  prefecture: string;
  downtownName: string;
  badgeText: string;
  name: string;
  followers: number;
  accent: string;
  storeNumber?: number;
};

const configs: FeaturedCastConfig[] = [
  {
    id: "hokkaido-1",
    downtownId: 1,
    prefecture: "北海道",
    downtownName: "すすきの",
    badgeText: "北海道 1位",
    name: "雪乃 ゆらら",
    followers: 128000,
    accent: "#f472b6",
  },
  {
    id: "miyagi-1",
    downtownId: 2,
    prefecture: "宮城県",
    downtownName: "国分町",
    badgeText: "宮城県 1位",
    name: "白波 みさ",
    followers: 103200,
    accent: "#c084fc",
  },
  {
    id: "tokyo-1",
    downtownId: 6,
    prefecture: "東京都",
    downtownName: "歌舞伎町",
    badgeText: "東京都 1位",
    name: "灯 れい",
    followers: 212400,
    accent: "#a5b4fc",
  },
  {
    id: "saitama-1",
    downtownId: 5,
    prefecture: "埼玉県",
    downtownName: "大宮",
    badgeText: "埼玉県 1位",
    name: "こはる",
    followers: 87600,
    accent: "#67e8f9",
  },
  {
    id: "kanagawa-1",
    downtownId: 38,
    prefecture: "神奈川県",
    downtownName: "横浜",
    badgeText: "神奈川県 1位",
    name: "岬 あやめ",
    followers: 154000,
    accent: "#fda4af",
  },
  {
    id: "chiba-1",
    downtownId: 39,
    prefecture: "千葉県",
    downtownName: "千葉",
    badgeText: "千葉県 1位",
    name: "翔 子",
    followers: 94500,
    accent: "#f0abfc",
  },
  {
    id: "aichi-1",
    downtownId: 40,
    prefecture: "愛知県",
    downtownName: "名古屋",
    badgeText: "愛知県 1位",
    name: "月城 ねね",
    followers: 167300,
    accent: "#bef264",
  },
  {
    id: "osaka-1",
    downtownId: 34,
    prefecture: "大阪府",
    downtownName: "北新地",
    badgeText: "大阪府 1位",
    name: "環 さら",
    followers: 185900,
    accent: "#f9a8d4",
  },
  {
    id: "kyoto-1",
    downtownId: 41,
    prefecture: "京都府",
    downtownName: "祇園",
    badgeText: "京都府 1位",
    name: "雅 みお",
    followers: 112400,
    accent: "#a78bfa",
  },
  {
    id: "fukuoka-1",
    downtownId: 36,
    prefecture: "福岡県",
    downtownName: "中洲",
    badgeText: "福岡県 1位",
    name: "星乃 りり",
    followers: 132800,
    accent: "#7dd3fc",
  },
];

const withStoreInfo = (config: FeaturedCastConfig): Cast => {
  const storeId = `store-${config.downtownId}-${config.storeNumber ?? 1}`;
  const store = getStoreById(storeId);

  return {
    id: config.id,
    downtownId: config.downtownId,
    prefecture: config.prefecture,
    downtownName: config.downtownName,
    badgeText: config.badgeText,
    name: config.name,
    followers: config.followers,
    storeId,
    storeName: store?.name ?? `${config.downtownName} CLUB`,
    image: PLACEHOLDER_IMAGE,
    castLink: `/casts/${config.downtownId}/${config.id}`,
    storeLink: store?.googleMapLink ?? "#",
    accent: config.accent,
  };
};

export const topCasts: Cast[] = configs.map(withStoreInfo).sort((a, b) => b.followers - a.followers);
