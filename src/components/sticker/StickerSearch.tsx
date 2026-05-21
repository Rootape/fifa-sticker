"use client";

import { useMemo, useState } from "react";
import type { Sticker } from "@/types";

type Props = {
  stickers: Sticker[];
  teams: Record<string, string>;
  placeholder?: string;
  onSelect: (sticker: Sticker) => void;
  renderTrailing?: (sticker: Sticker) => React.ReactNode;
  autoFocus?: boolean;
  limit?: number;
};

export function StickerSearch({
  stickers,
  teams,
  placeholder = "Buscar por nome ou código (ex: BRA14, Vinicius)",
  onSelect,
  renderTrailing,
  autoFocus = false,
  limit = 50,
}: Props) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matches = stickers.filter((s) => {
      return (
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        (teams[s.team] ?? "").toLowerCase().includes(q)
      );
    });
    return matches.slice(0, limit);
  }, [query, stickers, teams, limit]);

  return (
    <div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-dim)]">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>
        <input
          autoFocus={autoFocus}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="input !pl-9"
        />
      </div>

      {query.trim() && (
        <div className="mt-3 space-y-1.5">
          {results.length === 0 ? (
            <div className="text-sm text-[color:var(--color-text-muted)] py-8 text-center">
              Nenhuma figurinha encontrada para “{query}”.
            </div>
          ) : (
            results.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                onClick={() => onSelect(sticker)}
                className="w-full flex items-center gap-3 p-3 rounded-xl card card-interactive text-left"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    sticker.isFoil
                      ? "bg-[color:var(--color-foil-soft)] text-[color:var(--color-foil)]"
                      : "bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text)]"
                  }`}
                >
                  #{sticker.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {sticker.name}
                  </div>
                  <div className="text-xs text-[color:var(--color-text-muted)] truncate">
                    {sticker.country}{" "}
                    <span className="font-mono ml-1">{sticker.code}</span>
                  </div>
                </div>
                {renderTrailing?.(sticker)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
