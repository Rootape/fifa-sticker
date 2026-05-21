"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Sticker } from "@/types";

type Props = {
  initialStickers: Sticker[];
  teams: Record<string, string>;
};

function normalize(stickers: Sticker[]): Sticker[] {
  const groups = new Map<string, Sticker[]>();
  const order: string[] = [];
  for (const s of stickers) {
    if (!groups.has(s.team)) {
      groups.set(s.team, []);
      order.push(s.team);
    }
    groups.get(s.team)!.push(s);
  }
  const result: Sticker[] = [];
  for (const team of order) {
    const group = groups.get(team)!;
    if (team === "FWC") {
      result.push(...group);
    } else {
      group.forEach((s, idx) => {
        result.push({
          ...s,
          number: idx,
          id: `${team}${idx}`,
          code: `${team}${idx}`,
        });
      });
    }
  }
  return result;
}

function teamOrder(stickers: Sticker[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const s of stickers) {
    if (!seen.has(s.team)) {
      seen.add(s.team);
      order.push(s.team);
    }
  }
  return order;
}

export function CatalogView({ initialStickers, teams }: Props) {
  const router = useRouter();
  const [stickers, setStickers] = useState<Sticker[]>(initialStickers);
  const [savedStickers, setSavedStickers] =
    useState<Sticker[]>(initialStickers);
  const [activeTeam, setActiveTeam] = useState<string>(
    () => teamOrder(initialStickers)[0] ?? "FWC",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );

  const setActiveTeamAndClear = (code: string) => {
    setActiveTeam(code);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const orderedTeams = useMemo(() => teamOrder(stickers), [stickers]);

  const grouped = useMemo(() => {
    const map = new Map<string, Sticker[]>();
    for (const t of orderedTeams) map.set(t, []);
    for (const s of stickers) map.get(s.team)?.push(s);
    return map;
  }, [stickers, orderedTeams]);

  const dirty = useMemo(() => {
    if (stickers.length !== savedStickers.length) return true;
    for (let i = 0; i < stickers.length; i++) {
      const a = stickers[i];
      const b = savedStickers[i];
      if (
        a.id !== b.id ||
        a.code !== b.code ||
        a.number !== b.number ||
        a.name !== b.name ||
        a.team !== b.team
      )
        return true;
    }
    return false;
  }, [stickers, savedStickers]);

  const teamStickers = grouped.get(activeTeam) ?? [];

  const reorder = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setStickers((prev) => {
      const items = [...prev];
      const sourceIdx = items.findIndex((s) => s.id === sourceId);
      const targetIdx = items.findIndex((s) => s.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;
      if (items[sourceIdx].team !== items[targetIdx].team) return prev;
      const [moved] = items.splice(sourceIdx, 1);
      const newTargetIdx = items.findIndex((s) => s.id === targetId);
      items.splice(newTargetIdx, 0, moved);
      return normalize(items);
    });
  };

  const deleteSticker = (id: string) => {
    setStickers((prev) => normalize(prev.filter((s) => s.id !== id)));
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const bulkDelete = () => {
    if (selectedIds.size === 0) return;
    setStickers((prev) =>
      normalize(prev.filter((s) => !selectedIds.has(s.id))),
    );
    setSelectedIds(new Set());
  };

  const selectAllInTeam = () => {
    setSelectedIds(new Set(teamStickers.map((s) => s.id)));
  };

  const discard = () => {
    setStickers(savedStickers);
    setError(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/stickers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stickers }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `Falha ao salvar (HTTP ${res.status})`);
      }
      const data = (await res.json()) as { stickers: Sticker[] };
      setStickers(data.stickers);
      setSavedStickers(data.stickers);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  };

  const totalCount = stickers.length;
  const initialCount = savedStickers.length;
  const delta = totalCount - initialCount;

  return (
    <div className="space-y-5 animate-fade-in pb-24">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="text-xs text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] inline-flex items-center gap-1"
        >
          ← Voltar
        </Link>
        <span className="text-[10px] text-[color:var(--color-text-dim)] font-mono">
          {totalCount} figurinhas
          {delta !== 0 && (
            <span
              className={
                delta < 0
                  ? "ml-1 text-[color:var(--color-foil)]"
                  : "ml-1 text-[color:var(--color-brand)]"
              }
            >
              ({delta > 0 ? `+${delta}` : delta})
            </span>
          )}
        </span>
      </div>

      <header>
        <div className="text-xs font-medium text-[color:var(--color-brand)] uppercase tracking-wider">
          Catálogo
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1">
          Gerenciar figurinhas
        </h1>
        <p className="text-sm text-[color:var(--color-text-muted)] mt-1">
          Arraste para reordenar, clique para selecionar (uma ou várias) ou use
          o ✕ para remover individualmente. Para times não-FWC, os números são
          recalculados automaticamente (0 = escudo).
        </p>
      </header>

      <div className="-mx-4 px-4 overflow-x-auto scrollbar-thin">
        <div className="flex gap-1.5 min-w-max pb-1">
          {orderedTeams.map((code) => {
            const count = grouped.get(code)?.length ?? 0;
            const active = code === activeTeam;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setActiveTeamAndClear(code)}
                title={teams[code] ?? code}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors font-mono ${
                  active
                    ? "bg-[color:var(--color-brand)] text-[#062b1f] border-transparent"
                    : "bg-[color:var(--color-surface)] border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-hover)]"
                }`}
              >
                <span>{code}</span>
                <span className="ml-1.5 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-3 px-1 gap-3">
          <div>
            <div className="font-mono text-[10px] tracking-widest text-[color:var(--color-text-muted)]">
              {activeTeam}
            </div>
            <h2 className="text-lg font-bold tracking-tight">
              {teams[activeTeam] ?? activeTeam}
            </h2>
          </div>
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-[color:var(--color-text-muted)] font-mono">
                {selectedIds.size} selecionada{selectedIds.size > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="btn btn-ghost !py-1.5 !px-2.5 !text-[11px]"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `Excluir ${selectedIds.size} figurinha${selectedIds.size > 1 ? "s" : ""}?`,
                    )
                  ) {
                    bulkDelete();
                  }
                }}
                className="btn !py-1.5 !px-2.5 !text-[11px] bg-red-500/90 text-white hover:bg-red-500 border-transparent"
              >
                Excluir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-[color:var(--color-text-muted)]">
                {teamStickers.length} itens
              </span>
              {teamStickers.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllInTeam}
                  className="text-[11px] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] underline-offset-2 hover:underline"
                >
                  Selecionar tudo
                </button>
              )}
            </div>
          )}
        </div>

        {teamStickers.length === 0 ? (
          <div className="card text-center py-12 text-sm text-[color:var(--color-text-muted)]">
            Nenhuma figurinha neste time.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {teamStickers.map((s) => (
              <CatalogCard
                key={s.id}
                sticker={s}
                dragging={draggingId === s.id}
                over={overId === s.id && draggingId !== s.id}
                selected={selectedIds.has(s.id)}
                onToggleSelect={() => toggleSelect(s.id)}
                onDragStart={() => setDraggingId(s.id)}
                onDragEnter={() => {
                  if (draggingId && draggingId !== s.id) setOverId(s.id);
                }}
                onDragOver={(e) => {
                  if (draggingId) e.preventDefault();
                }}
                onDrop={() => {
                  if (draggingId) reorder(draggingId, s.id);
                  setDraggingId(null);
                  setOverId(null);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setOverId(null);
                }}
                onDelete={() => {
                  if (confirm(`Excluir ${s.code} — ${s.name}?`)) {
                    deleteSticker(s.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      {dirty && (
        <div className="fixed bottom-0 inset-x-0 z-50 border-t border-[color:var(--color-border)] bg-[color:var(--color-bg)]/95 backdrop-blur-lg animate-overlay-in">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-xs text-[color:var(--color-text-muted)] min-w-0">
              {error ? (
                <span className="text-red-400">{error}</span>
              ) : (
                <span>
                  Mudanças não salvas
                  {delta !== 0 && ` · ${delta > 0 ? `+${delta}` : delta}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={discard}
                disabled={saving}
                className="btn btn-ghost !py-2 !px-3 !text-xs"
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn btn-primary !py-2 !px-4 !text-xs"
              >
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      )}
    </div>
  );
}

type CardProps = {
  sticker: Sticker;
  dragging: boolean;
  over: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onDelete: () => void;
};

function CatalogCard({
  sticker,
  dragging,
  over,
  selected,
  onToggleSelect,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragEnd,
  onDelete,
}: CardProps) {
  return (
    <div
      draggable
      onClick={onToggleSelect}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", sticker.id);
        onDragStart();
      }}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      className={`group relative aspect-[4/3] rounded-xl overflow-hidden card cursor-grab active:cursor-grabbing transition-all ${
        dragging ? "opacity-40 scale-95" : ""
      } ${
        selected
          ? "border-[color:var(--color-brand)] ring-2 ring-[color:var(--color-brand)]/60 bg-[color:var(--color-brand-soft)]"
          : over
            ? "border-[color:var(--color-brand)] ring-2 ring-[color:var(--color-brand)]/40"
            : ""
      }`}
    >
      {selected && (
        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-[color:var(--color-brand)] text-[#062b1f] flex items-center justify-center z-10 shadow">
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
      )}
      {sticker.isFoil && (
        <div className="absolute inset-0 foil-shimmer pointer-events-none" />
      )}
      <div className="absolute inset-0 flex flex-col p-3">
        <div className="flex items-start justify-between gap-1">
          <span
            className={`font-mono text-[11px] font-semibold tracking-wider ${
              sticker.isFoil
                ? "text-[color:var(--color-foil)]"
                : "text-[color:var(--color-text-muted)]"
            }`}
          >
            #{sticker.number}
          </span>
          <DragHandle />
        </div>

        <div className="flex-1 flex items-center justify-center text-center px-1">
          <div className="font-bold tracking-tight text-base sm:text-lg leading-tight line-clamp-3 text-[color:var(--color-text)]">
            {sticker.name}
          </div>
        </div>

        {sticker.isFoil && (
          <div className="flex justify-center">
            <span className="chip chip-foil !text-[9px] !py-0.5 !px-1.5">
              FOIL
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        draggable={false}
        aria-label={`Excluir ${sticker.code}`}
        title="Excluir"
        className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-lg opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 hover:bg-red-500 transition-all"
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function DragHandle() {
  return (
    <span
      aria-hidden
      className="text-[color:var(--color-text-dim)] opacity-50 group-hover:opacity-100 transition-opacity"
    >
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <circle cx="9" cy="6" r="1.5" />
        <circle cx="15" cy="6" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="18" r="1.5" />
        <circle cx="15" cy="18" r="1.5" />
      </svg>
    </span>
  );
}
