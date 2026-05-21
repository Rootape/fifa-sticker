"use client";

import { useEffect, useMemo, useState } from "react";
import type { Friend, FriendSticker, Sticker } from "@/types";
import { decodeShareCode } from "@/lib/shareCode";
import { ModalPortal } from "@/components/layout/ModalPortal";

type Props = {
  stickers: Sticker[];
  existingFriends: Friend[];
  targetFriendId?: string;
  onImportNew: (name: string, stickers: FriendSticker[]) => Friend;
  onReplace: (id: string, name: string, stickers: FriendSticker[]) => void;
  onClose: () => void;
};

type Preview = {
  name: string;
  friendStickers: FriendSticker[];
  ownedCount: number;
  spareCount: number;
  matchExpected: boolean;
};

export function ImportCodeModal({
  stickers,
  existingFriends,
  targetFriendId,
  onImportNew,
  onReplace,
  onClose,
}: Props) {
  const [input, setInput] = useState("");
  const [touched, setTouched] = useState(false);

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

  const targetFriend = useMemo(
    () => existingFriends.find((f) => f.id === targetFriendId) ?? null,
    [existingFriends, targetFriendId],
  );

  const { preview, error } = useMemo<{
    preview: Preview | null;
    error: string | null;
  }>(() => {
    if (!input.trim()) return { preview: null, error: null };
    try {
      const decoded = decodeShareCode(input.trim());
      if (decoded.quantities.length !== stickers.length) {
        return {
          preview: null,
          error: `Código com ${decoded.quantities.length} figurinhas, mas o álbum tem ${stickers.length}. Pode ser uma versão diferente.`,
        };
      }
      const friendStickers: FriendSticker[] = [];
      let ownedCount = 0;
      let spareCount = 0;
      for (let i = 0; i < decoded.quantities.length; i++) {
        const q = decoded.quantities[i];
        if (q >= 1) {
          friendStickers.push({ stickerId: stickers[i].id, quantity: q });
          ownedCount++;
          if (q >= 2) spareCount += q - 1;
        }
      }
      return {
        preview: {
          name: decoded.name,
          friendStickers,
          ownedCount,
          spareCount,
          matchExpected: targetFriend
            ? decoded.name.trim().toLowerCase() ===
              targetFriend.name.trim().toLowerCase()
            : true,
        },
        error: null,
      };
    } catch (e) {
      return {
        preview: null,
        error: e instanceof Error ? e.message : "Código inválido",
      };
    }
  }, [input, stickers, targetFriend]);

  const nameClash = useMemo(() => {
    if (!preview || targetFriendId) return null;
    return existingFriends.find(
      (f) => f.name.trim().toLowerCase() === preview.name.trim().toLowerCase(),
    );
  }, [preview, existingFriends, targetFriendId]);

  const handleConfirm = () => {
    if (!preview) return;
    if (targetFriendId) {
      onReplace(targetFriendId, preview.name, preview.friendStickers);
    } else if (nameClash) {
      onReplace(nameClash.id, preview.name, preview.friendStickers);
    } else {
      onImportNew(preview.name, preview.friendStickers);
    }
    onClose();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      setTouched(true);
    } catch {}
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
              {targetFriend ? `Atualizar ${targetFriend.name}` : "Importar código"}
            </h2>
            <div className="text-xs text-[color:var(--color-text-muted)]">
              {targetFriend
                ? "Cole o código atualizado deste amigo"
                : "Cole o código que um amigo te mandou"}
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
              }}
              placeholder="Ex: JP:AQEAAAQ..."
              rows={4}
              className="input font-mono text-[11px] break-all"
              spellCheck={false}
              autoFocus
            />
          </div>

          {touched && error && (
            <div className="rounded-xl bg-[color:var(--color-danger-soft)] border border-[color:var(--color-danger)]/30 p-3 text-sm text-[color:var(--color-danger)]">
              {error}
            </div>
          )}

          {preview && (
            <div className="space-y-3">
              <div className="rounded-xl bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)] p-3">
                <div className="text-[10px] font-medium text-[color:var(--color-text-muted)] uppercase tracking-wider">
                  Nome
                </div>
                <div className="text-lg font-bold tracking-tight mt-0.5">
                  {preview.name}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Stat label="Coleção" value={preview.ownedCount} />
                <Stat label="Repetidas" value={preview.spareCount} />
              </div>
              {targetFriend && !preview.matchExpected && (
                <div className="rounded-xl bg-[color:var(--color-foil-soft)] border border-[color:var(--color-foil)]/30 p-3 text-xs text-[color:var(--color-foil)]">
                  O nome no código (<b>{preview.name}</b>) é diferente de{" "}
                  <b>{targetFriend.name}</b>. Confira se é o código certo.
                </div>
              )}
              {!targetFriend && nameClash && (
                <div className="rounded-xl bg-[color:var(--color-foil-soft)] border border-[color:var(--color-foil)]/30 p-3 text-xs text-[color:var(--color-foil)]">
                  Já existe um amigo chamado <b>{nameClash.name}</b>. Importar
                  vai substituir a coleção dele.
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
            className="btn btn-primary flex-1"
          >
            {targetFriendId || nameClash ? "Substituir" : "Importar"}
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
