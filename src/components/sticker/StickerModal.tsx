"use client";

import { useEffect, useState } from "react";
import type { Sticker } from "@/types";

type Props = {
  sticker: Sticker;
  initialOwned: boolean;
  initialQuantity: number;
  onClose: () => void;
  onSave: (owned: boolean, quantity: number) => void;
};

export function StickerModal({
  sticker,
  initialOwned,
  initialQuantity,
  onClose,
  onSave,
}: Props) {
  const [owned, setOwned] = useState(initialOwned);
  const [quantity, setQuantity] = useState(
    initialQuantity > 0 ? initialQuantity : 1,
  );

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

  const save = () => {
    onSave(owned, owned ? Math.max(1, quantity) : 0);
    onClose();
  };

  const inc = () => setQuantity((q) => Math.min(99, q + 1));
  const dec = () => setQuantity((q) => Math.max(1, q - 1));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 animate-overlay-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm card animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="font-mono text-xs text-[color:var(--color-text-muted)] tracking-wider">
                {sticker.code}
              </div>
              <h2 className="text-xl font-semibold tracking-tight mt-1">
                {sticker.name}
              </h2>
              <div className="text-sm text-[color:var(--color-text-muted)] mt-0.5">
                {sticker.country}
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

          {sticker.isFoil && (
            <div className="mb-4">
              <span className="chip chip-foil">★ Foil</span>
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-xl bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)]">
            <div>
              <div className="text-sm font-medium">Tenho esta figurinha</div>
              <div className="text-xs text-[color:var(--color-text-muted)]">
                Marque ao colar no álbum
              </div>
            </div>
            <Toggle checked={owned} onChange={setOwned} />
          </div>

          <div
            className={`mt-3 transition-all ${
              owned
                ? "opacity-100"
                : "opacity-40 pointer-events-none select-none"
            }`}
          >
            <label className="text-sm font-medium block mb-2">
              Quantidade
              {quantity > 1 && (
                <span className="ml-2 text-xs text-[color:var(--color-foil)]">
                  {quantity - 1} repetida{quantity - 1 > 1 ? "s" : ""}
                </span>
              )}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={dec}
                className="btn btn-ghost w-11 h-11 !p-0"
                aria-label="Diminuir"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (Number.isFinite(n)) {
                    setQuantity(Math.max(1, Math.min(99, n)));
                  }
                }}
                className="input text-center text-lg font-semibold flex-1"
              />
              <button
                type="button"
                onClick={inc}
                className="btn btn-ghost w-11 h-11 !p-0"
                aria-label="Aumentar"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              className="btn btn-primary flex-1"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        checked
          ? "bg-[color:var(--color-brand)]"
          : "bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)]"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
