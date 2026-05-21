import { loadStickers } from "@/lib/stickers";
import { StickerGridFiltered } from "@/components/sticker/StickerGridFiltered";

export default async function MissingPage() {
  const data = await loadStickers();
  return (
    <StickerGridFiltered
      mode="missing"
      stickers={data.stickers}
      teams={data.teams}
    />
  );
}
