import { Cast } from "@/types/cast";
import { StoreRankingEntry } from "@/types/store";

const DEFAULT_SITE_ORIGIN = "https://cabaguide.com";

const getSiteOrigin = () => {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) {
    return DEFAULT_SITE_ORIGIN;
  }
  return value.replace(/\/$/, "");
};

const SITE_ORIGIN = getSiteOrigin();

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const toAbsoluteUrl = (value?: string | null): string => {
  if (!value) {
    return SITE_ORIGIN;
  }
  if (isAbsoluteUrl(value)) {
    return value;
  }
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${SITE_ORIGIN}${normalized}`;
};

const serializeJsonLd = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");

type CastRankingStructuredDataOptions = {
  name: string;
  description: string;
  url: string;
  casts: Cast[];
  startPosition?: number;
};

export const buildCastRankingStructuredData = ({
  name,
  description,
  url,
  casts,
  startPosition = 0,
}: CastRankingStructuredDataOptions) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name,
  description,
  url: toAbsoluteUrl(url),
  itemListOrder: "https://schema.org/ItemListOrderDescending",
  numberOfItems: casts.length,
  itemListElement: casts.map((cast, index) => ({
    "@type": "ListItem",
    position: startPosition + index + 1,
    url: toAbsoluteUrl(cast.castLink),
    item: {
      "@type": "Person",
      name: cast.name,
      url: toAbsoluteUrl(cast.castLink),
      image: toAbsoluteUrl(cast.image),
      memberOf: {
        "@type": "Organization",
        name: cast.storeName,
        url: toAbsoluteUrl(cast.storeLink),
      },
      homeLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressRegion: cast.prefecture,
          addressLocality: cast.downtownName,
        },
      },
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "followers",
          value: cast.followers,
        },
      ],
    },
  })),
});

type StoreRankingStructuredDataOptions = {
  name: string;
  description: string;
  url: string;
  stores: (StoreRankingEntry & { url: string })[];
};

export const buildStoreRankingStructuredData = ({
  name,
  description,
  url,
  stores,
}: StoreRankingStructuredDataOptions) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name,
  description,
  url: toAbsoluteUrl(url),
  itemListOrder: "https://schema.org/ItemListOrderDescending",
  numberOfItems: stores.length,
  itemListElement: stores.map((store, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: toAbsoluteUrl(store.url),
    item: {
      "@type": "LocalBusiness",
      name: store.storeName,
      url: toAbsoluteUrl(store.url),
      address: {
        "@type": "PostalAddress",
        addressRegion: store.todofukenName,
        addressLocality: store.downtownName,
      },
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "followers",
          value: store.followers,
        },
      ],
    },
  })),
});

type StructuredDataScriptProps = {
  data: Record<string, unknown>;
};

export const StructuredDataScript = ({ data }: StructuredDataScriptProps) => (
  <script
    type="application/ld+json"
    suppressHydrationWarning
    dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
  />
);
