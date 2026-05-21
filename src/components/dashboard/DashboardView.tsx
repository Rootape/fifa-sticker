"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { StickersData } from "@/types";
import { useCollection } from "@/hooks/useCollection";
import { TeamProgressCard } from "@/components/team/TeamProgressCard";

type Props = { data: StickersData };

export function DashboardView({ data }: Props) {
  const { entries, loaded } = useCollection();

  const stats = useMemo(() => {
    const collectionMap = new Map(
      entries.filter((e) => e.owned).map((e) => [e.stickerId, e]),
    );

    const total = data.stickers.length;
    const owned = collectionMap.size;
    const duplicates = entries.reduce(
      (sum, e) => sum + (e.owned ? Math.max(0, e.quantity - 1) : 0),
      0,
    );

    const teamCodes = Object.keys(data.teams);
    const perTeam = teamCodes.map((code) => {
      const teamStickers = data.stickers.filter((s) => s.team === code);
      const ownedCount = teamStickers.filter((s) =>
        collectionMap.has(s.id),
      ).length;
      const dupCount = teamStickers.reduce((sum, s) => {
        const e = collectionMap.get(s.id);
        return sum + (e ? Math.max(0, e.quantity - 1) : 0);
      }, 0);
      return {
        code,
        name: data.teams[code] ?? code,
        owned: ownedCount,
        total: teamStickers.length,
        duplicates: dupCount,
      };
    });

    const completeTeams = perTeam.filter(
      (t) => t.total > 0 && t.owned === t.total,
    ).length;

    return { total, owned, duplicates, perTeam, completeTeams };
  }, [entries, data]);

  const pct = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="card p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs font-medium text-[color:var(--color-brand)] uppercase tracking-wider">
              Minha Coleção
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
              Panini FIFA World Cup 2026
            </h1>
            <p className="text-sm text-[color:var(--color-text-muted)] mt-1">
              {loaded
                ? `${stats.owned} de ${stats.total} figurinhas coladas`
                : "Carregando..."}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl md:text-5xl font-bold tracking-tight">
              {pct}
              <span className="text-2xl text-[color:var(--color-text-muted)]">
                %
              </span>
            </div>
          </div>
        </div>
        <div className="mt-5 progress">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="Coladas" value={stats.owned} accent="brand" />
          <Stat
            label="Faltando"
            value={stats.total - stats.owned}
            accent="muted"
          />
          <Stat label="Repetidas" value={stats.duplicates} accent="foil" />
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3 px-1 gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Seleções
          </h2>
          <div className="flex items-center gap-3 text-xs text-[color:var(--color-text-muted)]">
            <span>
              {stats.completeTeams} de {stats.perTeam.length} completas
            </span>
            <Link
              href="/catalog"
              className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] underline-offset-2 hover:underline"
            >
              Gerenciar
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.perTeam.map((t) => (
            <TeamProgressCard
              key={t.code}
              code={t.code}
              name={t.name}
              owned={t.owned}
              total={t.total}
              duplicates={t.duplicates}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "brand" | "foil" | "muted";
}) {
  const color =
    accent === "brand"
      ? "text-[color:var(--color-brand)]"
      : accent === "foil"
        ? "text-[color:var(--color-foil)]"
        : "text-[color:var(--color-text)]";
  return (
    <div className="p-3 rounded-xl bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)]">
      <div className={`text-2xl font-bold tracking-tight ${color}`}>
        {value}
      </div>
      <div className="text-[11px] font-medium text-[color:var(--color-text-muted)] uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}
