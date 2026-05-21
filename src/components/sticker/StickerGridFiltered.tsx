"use client";

import { useMemo, useState } from "react";
import type { Sticker, StickerStatus } from "@/types";
import { useCollection } from "@/hooks/useCollection";
import { StickerCard } from "@/components/sticker/StickerCard";
import { StickerModal } from "@/components/sticker/StickerModal";

type EnrichedSticker = {
  sticker: Sticker;
  status: StickerStatus;
  quantity: number;
  owned: boolean;
};

type Mode = "missing" | "duplicates";

type Props = {
  mode: Mode;
  stickers: Sticker[];
  teams: Record<string, string>;
};

export function StickerGridFiltered({ mode, stickers, teams }: Props) {
  const { entries, getEntry, setEntry, increment, loaded } = useCollection();
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const entryMap = new Map(entries.map((e) => [e.stickerId, e]));
    return stickers
      .map((s) => {
        const e = entryMap.get(s.id);
        const quantity = e?.quantity ?? 0;
        const owned = e?.owned ?? false;
        const status: StickerStatus = !owned
          ? "missing"
          : quantity > 1
            ? "duplicate"
            : "owned";
        return { sticker: s, status, quantity, owned };
      })
      .filter(({ sticker, owned, quantity }) => {
        if (teamFilter !== "ALL" && sticker.team !== teamFilter) return false;
        if (mode === "missing") return !owned;
        return quantity > 1;
      });
  }, [stickers, entries, mode, teamFilter]);

  const teamCounts = useMemo(() => {
    const entryMap = new Map(entries.map((e) => [e.stickerId, e]));
    const counts = new Map<string, number>();
    stickers.forEach((s) => {
      const e = entryMap.get(s.id);
      const owned = e?.owned ?? false;
      const quantity = e?.quantity ?? 0;
      const matches = mode === "missing" ? !owned : quantity > 1;
      if (matches) counts.set(s.team, (counts.get(s.team) ?? 0) + 1);
    });
    return counts;
  }, [stickers, entries, mode]);

  const totalFiltered =
    teamFilter === "ALL"
      ? Array.from(teamCounts.values()).reduce((a, b) => a + b, 0)
      : (teamCounts.get(teamFilter) ?? 0);

  const availableTeams = Object.keys(teams).filter(
    (code) => (teamCounts.get(code) ?? 0) > 0,
  );

  const selected: EnrichedSticker | null = (() => {
    if (!selectedId) return null;
    const s = stickers.find((x) => x.id === selectedId);
    if (!s) return null;
    const e = getEntry(s.id);
    const quantity = e?.quantity ?? 0;
    const owned = e?.owned ?? false;
    const status: StickerStatus = !owned
      ? "missing"
      : quantity > 1
        ? "duplicate"
        : "owned";
    return { sticker: s, status, quantity, owned };
  })();

  const title = mode === "missing" ? "Faltantes" : "Repetidas";
  const description =
    mode === "missing"
      ? "Figurinhas que ainda preciso para o álbum"
      : "Suas cópias extras, prontas para trocar";

  return (
    <div className="space-y-5 animate-fade-in">
      <header>
        <div className="text-xs font-medium text-[color:var(--color-brand)] uppercase tracking-wider">
          {title}
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1">
          {loaded ? `${totalFiltered} ${title.toLowerCase()}` : title}
        </h1>
        <p className="text-sm text-[color:var(--color-text-muted)] mt-1">
          {description}
        </p>
      </header>

      <div className="-mx-1 px-1 overflow-x-auto scrollbar-thin">
        <div className="flex gap-1.5 min-w-max pb-1">
          <FilterChip
            active={teamFilter === "ALL"}
            onClick={() => setTeamFilter("ALL")}
            label="Todos"
            count={Array.from(teamCounts.values()).reduce((a, b) => a + b, 0)}
          />
          {availableTeams.map((code) => (
            <FilterChip
              key={code}
              active={teamFilter === code}
              onClick={() => setTeamFilter(code)}
              label={code}
              count={teamCounts.get(code) ?? 0}
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState mode={mode} hasAny={teamCounts.size > 0} />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
          {filtered.map(({ sticker, status, quantity }) => (
            <StickerCard
              key={sticker.id}
              sticker={sticker}
              status={status}
              quantity={quantity}
              onClick={() => setSelectedId(sticker.id)}
              onQuickAdd={() => increment(sticker.id)}
              compact
            />
          ))}
        </div>
      )}

      {selected && (
        <StickerModal
          sticker={selected.sticker}
          initialOwned={selected.owned}
          initialQuantity={selected.quantity}
          onClose={() => setSelectedId(null)}
          onSave={(owned, quantity) =>
            setEntry(selected.sticker.id, owned, quantity)
          }
        />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
        active
          ? "bg-[color:var(--color-brand-soft)] text-emerald-300 border-[color:var(--color-brand)]/40"
          : "bg-[color:var(--color-surface)] border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)]"
      }`}
    >
      <span className="font-mono">{label}</span>
      <span className="ml-1.5 opacity-70">{count}</span>
    </button>
  );
}

function EmptyState({ mode, hasAny }: { mode: Mode; hasAny: boolean }) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-3">{mode === "missing" ? "🎉" : "✨"}</div>
      <div className="font-semibold tracking-tight">
        {mode === "missing"
          ? hasAny
            ? "Nada faltando nessa seleção"
            : "Álbum completo!"
          : hasAny
            ? "Nenhuma repetida nessa seleção"
            : "Você ainda não tem repetidas"}
      </div>
      <p className="text-sm text-[color:var(--color-text-muted)] mt-1 max-w-sm mx-auto">
        {mode === "missing"
          ? "Continue colando e abrindo pacotes para preencher o álbum."
          : "Abra mais pacotes — repetidas viram trocas com os amigos."}
      </p>
    </div>
  );
}
