"use client";

import { useEffect, useMemo, useState } from "react";
import type { Sticker } from "@/types";
import { encodeShareCode } from "@/lib/shareCode";
import { ModalPortal } from "@/components/layout/ModalPortal";

const PROFILE_NAME_KEY = "fifa:profile-name";

type Props = {
  stickers: Sticker[];
  quantities: Map<string, number>;
  onClose: () => void;
};

export function ExportCodeModal({ stickers, quantities, onClose }: Props) {
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_NAME_KEY);
      if (stored) setName(stored);
    } catch {}
  }, []);

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

  const ownedQty = useMemo(() => {
    let owned = 0;
    let spares = 0;
    for (const q of quantities.values()) {
      if (q >= 1) owned++;
      if (q >= 2) spares += q - 1;
    }
    return { owned, spares };
  }, [quantities]);

  const { code, error } = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return { code: "", error: null as string | null };
    try {
      const qtyArr = stickers.map((s) => quantities.get(s.id) ?? 0);
      const c = encodeShareCode(trimmed, qtyArr);
      return { code: c, error: null };
    } catch (e) {
      return {
        code: "",
        error: e instanceof Error ? e.message : "Erro ao gerar código",
      };
    }
  }, [name, stickers, quantities]);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      try {
        localStorage.setItem(PROFILE_NAME_KEY, name.trim());
      } catch {}
      setTimeout(() => setCopied(false), 2000);
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
            <h2 className="font-semibold tracking-tight">Meu código</h2>
            <div className="text-xs text-[color:var(--color-text-muted)]">
              Compartilhe sua coleção com amigos
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
            <label className="text-sm font-medium block mb-2">
              Seu nome ou apelido
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: JP, Maria, João..."
              maxLength={40}
              className="input"
            />
            <div className="text-[11px] text-[color:var(--color-text-muted)] mt-1.5">
              Aparece pra quem importar seu código.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="Coleção" value={ownedQty.owned} />
            <Stat label="Repetidas" value={ownedQty.spares} />
          </div>

          {error && (
            <div className="text-sm text-[color:var(--color-danger)]">
              {error}
            </div>
          )}

          {code && (
            <div>
              <div className="text-sm font-medium mb-2 flex items-center justify-between">
                <span>Código gerado</span>
                <span className="text-[11px] text-[color:var(--color-text-muted)] font-mono">
                  {code.length} chars
                </span>
              </div>
              <div className="rounded-xl bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)] p-3 font-mono text-[11px] break-all max-h-40 overflow-y-auto scrollbar-thin select-all">
                {code}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[color:var(--color-border)] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost flex-1"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!code}
            className="btn btn-primary flex-1"
          >
            {copied ? "Copiado!" : "Copiar código"}
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
