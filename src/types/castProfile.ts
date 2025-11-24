export type SNSPlatform = "instagram" | "tiktok";

export type CastSNS = {
  castId: string;
  platform: SNSPlatform;
  url: string;
  handle: string;
};

export type CastFollowerSnapshot = {
  castId: string;
  platform: SNSPlatform;
  followers: number;
  capturedAt: string;
};
