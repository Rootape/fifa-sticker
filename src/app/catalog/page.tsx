import { loadStickers } from "@/lib/stickers";
import { CatalogView } from "@/components/catalog/CatalogView";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const data = await loadStickers();
  return <CatalogView initialStickers={data.stickers} teams={data.teams} />;
}
