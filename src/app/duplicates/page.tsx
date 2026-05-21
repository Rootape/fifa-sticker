import { loadStickers } from "@/lib/stickers";
import { StickerGridFiltered } from "@/components/sticker/StickerGridFiltered";

export default async function DuplicatesPage() {
  const data = await loadStickers();
  return (
    <StickerGridFiltered
      mode="duplicates"
      stickers={data.stickers}
      teams={data.teams}
    />
  );
}
