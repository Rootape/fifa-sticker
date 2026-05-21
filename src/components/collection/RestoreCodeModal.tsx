"use client";

import { useEffect, useMemo, useState } from "react";
import type { CollectionEntry, Sticker, StickersData } from "@/types";
import { decodeShareCode } from "@/lib/shareCode";
import { ModalPortal } from "@/components/layout/ModalPortal";

type Props = {
  currentOwned: number;
  currentSpares: number;
  onRestore: (entries: CollectionEntry[]) => void;
  onClose: () => void;
};

type Preview = {
  name: string;
  entries: CollectionEntry[];
  ownedCount: number;
  spareCount: number;
};

export function RestoreCodeModal({
  currentOwned,
  currentSpares,
  onRestore,
  onClose,
}: Props) {
  const [input, setInput] = useState("");
  const [touched, setTouched] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [stickers, setStickers] = useState<Sticker[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    fetch("/data/stickers.json", { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<StickersData>;
      })
      .then((data) => {
        if (!cancelled) setStickers(data.stickers);
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Falha ao carregar catálogo",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { preview, error } = useMemo<{
    preview: Preview | null;
    error: string | null;
  }>(() => {
    if (!input.trim()) return { preview: null, error: null };
    if (!stickers) return { preview: null, error: null };
    try {
      const decoded = decodeShareCode(input.trim());
      if (decoded.quantities.length !== stickers.length) {
        return {
          preview: null,
          error: `Código com ${decoded.quantities.length} figurinhas, mas o álbum tem ${stickers.length}. Pode ser uma versão diferente.`,
        };
      }
      const entries: CollectionEntry[] = [];
      let ownedCount = 0;
      let spareCount = 0;
      for (let i = 0; i < decoded.quantities.length; i++) {
        const q = decoded.quantities[i];
        if (q >= 1) {
          entries.push({
            stickerId: stickers[i].id,
            owned: true,
            quantity: q,
          });
          ownedCount++;
          if (q >= 2) spareCount += q - 1;
        }
      }
      return {
        preview: { name: decoded.name, entries, ownedCount, spareCount },
        error: null,
      };
    } catch (e) {
      return {
        preview: null,
        error: e instanceof Error ? e.message : "Código inválido",
      };
    }
  }, [input, stickers]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      setTouched(true);
    } catch {}
  };

  const handleConfirm = () => {
    if (!preview) return;
    if (!confirming && currentOwned > 0) {
      setConfirming(true);
      return;
    }
    onRestore(preview.entries);
    onClose();
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
                Restaurar coleção
              </h2>
              <div className="text-xs text-[color:var(--color-text-muted)]">
                Carregar coleção a partir de um código gerado anteriormente
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] p-1 -m-1"
              aria-label="Fechar"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto scrollbar-thin space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Código</label>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="text-xs text-[color:var(--color-brand)] hover:underline"
                >
                  Colar
                </button>
              </div>
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setTouched(true);
                  setConfirming(false);
                }}
                placeholder="Ex: JP:AQEAAAQ..."
                rows={4}
                className="input font-mono text-[11px] break-all"
                spellCheck={false}
                autoFocus
              />
              <div className="text-[11px] text-[color:var(--color-text-muted)] mt-1.5">
                Use um código que você mesmo gerou (botão "Meu código" em
                Amigos).
              </div>
            </div>

            {!stickers && !loadError && (
              <div className="text-sm text-[color:var(--color-text-muted)]">
                Carregando catálogo...
              </div>
            )}

            {loadError && (
              <div className="rounded-xl bg-[color:var(--color-danger-soft)] border border-[color:var(--color-danger)]/30 p-3 text-sm text-[color:var(--color-danger)]">
                Não foi possível carregar o catálogo de figurinhas: {loadError}
              </div>
            )}

            {touched && error && (
              <div className="rounded-xl bg-[color:var(--color-danger-soft)] border border-[color:var(--color-danger)]/30 p-3 text-sm text-[color:var(--color-danger)]">
                {error}
              </div>
            )}

            {preview && (
              <div className="space-y-3">
                <div className="rounded-xl bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)] p-3">
                  <div className="text-[10px] font-medium text-[color:var(--color-text-muted)] uppercase tracking-wider">
                    Nome no código
                  </div>
                  <div className="text-lg font-bold tracking-tight mt-0.5">
                    {preview.name}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Stat label="Coladas" value={preview.ownedCount} />
                  <Stat label="Repetidas" value={preview.spareCount} />
                </div>

                {currentOwned > 0 && (
                  <div className="rounded-xl bg-[color:var(--color-danger-soft)] border border-[color:var(--color-danger)]/30 p-3 text-sm">
                    <div className="font-semibold text-[color:var(--color-danger)] mb-1">
                      Isso vai substituir sua coleção atual
                    </div>
                    <div className="text-[color:var(--color-text-muted)]">
                      Você tem {currentOwned} colada
                      {currentOwned !== 1 ? "s" : ""} e {currentSpares}{" "}
                      repetida{currentSpares !== 1 ? "s" : ""} salvas no
                      navegador. Após restaurar, esses dados serão perdidos.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[color:var(--color-border)] flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!preview}
              className={`btn flex-1 ${
                confirming ? "btn-danger" : "btn-primary"
              }`}
            >
              {confirming ? "Substituir mesmo assim" : "Restaurar"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-xl bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)]">
      <div className="text-xl font-bold tracking-tight">{value}</div>
      <div className="text-[10px] font-medium text-[color:var(--color-text-muted)] uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
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
  );
}
