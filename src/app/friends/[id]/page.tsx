import { loadStickers } from "@/lib/stickers";
import { FriendDetailView } from "@/components/friends/FriendDetailView";

export default async function FriendDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadStickers();
  return <FriendDetailView friendId={id} data={data} />;
}
