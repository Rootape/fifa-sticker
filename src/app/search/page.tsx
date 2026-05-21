import { loadStickers } from "@/lib/stickers";
import { SearchView } from "@/components/search/SearchView";

export default async function SearchPage() {
  const data = await loadStickers();
  return <SearchView data={data} />;
}
