export type TopCast = {
  id: string;
  prefecture: string;
  name: string;
  followers: number;
  storeName: string;
  image: string;
  castLink: string;
  storeLink: string;
  accent: string;
};

export const topCasts: TopCast[] = [
  {
    id: "hokkaido-1",
    prefecture: "北海道",
    name: "雪乃 ゆらら",
    followers: 128000,
    storeName: "すすきの LUNAR",
    image: "/images/top-casts/placeholder.svg",
    castLink: "#hokkaido",
    storeLink: "#hokkaido-store",
    accent: "#f472b6",
  },
  {
    id: "miyagi-1",
    prefecture: "宮城県",
    name: "白波 みさ",
    followers: 103200,
    storeName: "仙台 ORBIT",
    image: "/images/top-casts/placeholder.svg",
    castLink: "#miyagi",
    storeLink: "#miyagi-store",
    accent: "#c084fc",
  },
  {
    id: "tokyo-1",
    prefecture: "東京都",
    name: "灯 れい",
    followers: 212400,
    storeName: "歌舞伎町 TWILIGHT",
    image: "/images/top-casts/placeholder.svg",
    castLink: "#tokyo",
    storeLink: "#tokyo-store",
    accent: "#a5b4fc",
  },
  {
    id: "saitama-1",
    prefecture: "埼玉県",
    name: "こはる",
    followers: 87600,
    storeName: "大宮 NEON",
    image: "/images/top-casts/placeholder.svg",
    castLink: "#saitama",
    storeLink: "#saitama-store",
    accent: "#67e8f9",
  },
  {
    id: "kanagawa-1",
    prefecture: "神奈川県",
    name: "岬 あやめ",
    followers: 154000,
    storeName: "横浜 ARIA",
    image: "/images/top-casts/placeholder.svg",
    castLink: "#kanagawa",
    storeLink: "#kanagawa-store",
    accent: "#fda4af",
  },
  {
    id: "chiba-1",
    prefecture: "千葉県",
    name: "翔 子",
    followers: 94500,
    storeName: "千葉 LAGOON",
    image: "/images/top-casts/placeholder.svg",
    castLink: "#chiba",
    storeLink: "#chiba-store",
    accent: "#f0abfc",
  },
  {
    id: "aichi-1",
    prefecture: "愛知県",
    name: "月城 ねね",
    followers: 167300,
    storeName: "名古屋 HALO",
    image: "/images/top-casts/placeholder.svg",
    castLink: "#aichi",
    storeLink: "#aichi-store",
    accent: "#bef264",
  },
  {
    id: "osaka-1",
    prefecture: "大阪府",
    name: "環 さら",
    followers: 185900,
    storeName: "北新地 OPIA",
    image: "/images/top-casts/placeholder.svg",
    castLink: "#osaka",
    storeLink: "#osaka-store",
    accent: "#f9a8d4",
  },
  {
    id: "kyoto-1",
    prefecture: "京都府",
    name: "雅 みお",
    followers: 112400,
    storeName: "祇園 ASTRAL",
    image: "/images/top-casts/placeholder.svg",
    castLink: "#kyoto",
    storeLink: "#kyoto-store",
    accent: "#a78bfa",
  },
  {
    id: "fukuoka-1",
    prefecture: "福岡県",
    name: "星乃 りり",
    followers: 132800,
    storeName: "中洲 SPECTRA",
    image: "/images/top-casts/placeholder.svg",
    castLink: "#fukuoka",
    storeLink: "#fukuoka-store",
    accent: "#7dd3fc",
  },
];
