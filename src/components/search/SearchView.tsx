"use client";

import { useState } from "react";
import type { Sticker, StickersData } from "@/types";
import { useCollection } from "@/hooks/useCollection";
import { StickerSearch } from "@/components/sticker/StickerSearch";
import { StickerModal } from "@/components/sticker/StickerModal";

type Props = { data: StickersData };

export function SearchView({ data }: Props) {
  const { getEntry, setEntry } = useCollection();
  const [selected, setSelected] = useState<Sticker | null>(null);

  return (
    <div className="space-y-5 animate-fade-in">
      <header>
        <div className="text-xs font-medium text-[color:var(--color-brand)] uppercase tracking-wider">
          Buscar
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1">
          Encontrar figurinha
        </h1>
        <p className="text-sm text-[color:var(--color-text-muted)] mt-1">
          Busque por nome, país ou código (BRA14, Vinicius, Brasil...)
        </p>
      </header>

      <StickerSearch
        stickers={data.stickers}
        teams={data.teams}
        onSelect={setSelected}
        autoFocus
        limit={80}
        renderTrailing={(s) => {
          const e = getEntry(s.id);
          if (!e?.owned) {
            return (
              <span className="chip chip-muted shrink-0">Falta</span>
            );
          }
          if (e.quantity > 1) {
            return <span className="chip chip-foil shrink-0">+{e.quantity - 1}</span>;
          }
          return <span className="chip chip-brand shrink-0">Tenho</span>;
        }}
      />

      {selected && (
        <StickerModal
          sticker={selected}
          initialOwned={!!getEntry(selected.id)?.owned}
          initialQuantity={getEntry(selected.id)?.quantity ?? 0}
          onClose={() => setSelected(null)}
          onSave={(owned, quantity) => setEntry(selected.id, owned, quantity)}
        />
      )}
    </div>
  );
}
