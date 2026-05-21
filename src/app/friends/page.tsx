import { loadStickers } from "@/lib/stickers";
import { FriendsView } from "@/components/friends/FriendsView";

export default async function FriendsPage() {
  const data = await loadStickers();
  return <FriendsView data={data} />;
}
