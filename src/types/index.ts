export type Sticker = {
  id: string;
  code: string;
  number: number;
  name: string;
  team: string;
  country: string;
  isFoil: boolean;
};

export type StickersData = {
  meta: {
    title: string;
    totalStickers: number;
    totalTeams: number;
    source: string;
  };
  teams: Record<string, string>;
  stickers: Sticker[];
};

export type CollectionEntry = {
  stickerId: string;
  owned: boolean;
  quantity: number;
};

export type FriendSticker = {
  stickerId: string;
  quantity: number;
};

export type Friend = {
  id: string;
  name: string;
  stickers: FriendSticker[];
  importedAt?: number;
};

export type StickerStatus = "missing" | "owned" | "duplicate";

export type StickerWithStatus = Sticker & {
  status: StickerStatus;
  quantity: number;
};
