"use client";

import { useEffect, useState } from "react";
import type { Friend, Sticker } from "@/types";
import { StickerSearch } from "@/components/sticker/StickerSearch";
import { ModalPortal } from "@/components/layout/ModalPortal";

type Props = {
  friend: Friend;
  stickers: Sticker[];
  teams: Record<string, string>;
  onAdd: (stickerId: string) => void;
  onClose: () => void;
};

export function AddDuplicateModal({
  friend,
  stickers,
  teams,
  onAdd,
  onClose,
}: Props) {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const currentMap = new Map(
    friend.stickers.map((d) => [d.stickerId, d.quantity]),
  );

  const handleSelect = (sticker: Sticker) => {
    onAdd(sticker.id);
    setRecent((r) =>
      [sticker.id, ...r.filter((id) => id !== sticker.id)].slice(0, 5),
    );
  };

  return (
    <ModalPortal>
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-overlay-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full md:max-w-lg max-h-[90vh] md:max-h-[80vh] flex flex-col card animate-modal-in rounded-b-none md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[color:var(--color-border)] flex items-center justify-between">
          <div>
            <h2 className="font-semibold tracking-tight">
              Adicionar figurinha
            </h2>
            <div className="text-xs text-[color:var(--color-text-muted)]">
              para {friend.name}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] p-1 -m-1"
            aria-label="Fechar"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto scrollbar-thin">
          {recent.length > 0 && (
            <div className="mb-3 text-xs text-[color:var(--color-brand)] font-medium">
              Adicionado: {recent.length} {recent.length === 1 ? "item" : "itens"}{" "}
              · use a busca para adicionar mais
            </div>
          )}
          <StickerSearch
            stickers={stickers}
            teams={teams}
            onSelect={handleSelect}
            autoFocus
            placeholder="Buscar figurinha (ex: BRA14, Vinicius)"
            renderTrailing={(s) => {
              const current = currentMap.get(s.id) ?? 0;
              return (
                <span
                  className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                    current > 0
                      ? "bg-[color:var(--color-brand-soft)] text-emerald-300"
                      : "bg-[color:var(--color-bg-elevated)] text-[color:var(--color-text-muted)]"
                  }`}
                  aria-label={`Quantidade: ${current}`}
                >
                  {current > 0 ? `×${current}` : "+"}
                </span>
              );
            }}
          />
        </div>

        <div className="p-4 border-t border-[color:var(--color-border)]">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary w-full"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
