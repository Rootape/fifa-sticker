import { notFound } from "next/navigation";
import { loadStickers } from "@/lib/stickers";
import { TeamView } from "@/components/team/TeamView";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = await loadStickers();
  const upper = code.toUpperCase();
  const teamName = data.teams[upper];
  if (!teamName) notFound();
  const stickers = data.stickers
    .filter((s) => s.team === upper)
    .sort((a, b) => a.number - b.number);
  const allTeams = Object.entries(data.teams).map(([c, name]) => ({
    code: c,
    name,
  }));
  return (
    <TeamView
      teamCode={upper}
      teamName={teamName}
      stickers={stickers}
      allTeams={allTeams}
    />
  );
}
