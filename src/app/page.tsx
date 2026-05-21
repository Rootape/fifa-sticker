import { loadStickers } from "@/lib/stickers";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default async function HomePage() {
  const data = await loadStickers();
  return <DashboardView data={data} />;
}
