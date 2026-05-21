"use client";

import type { Sticker, StickerStatus } from "@/types";

type Props = {
  sticker: Sticker;
  status: StickerStatus;
  quantity: number;
  onClick?: () => void;
  onQuickAdd?: () => void;
  compact?: boolean;
};

export function StickerCard({
  sticker,
  status,
  quantity,
  onClick,
  onQuickAdd,
  compact = false,
}: Props) {
  const extras = Math.max(0, quantity - 1);
  const isPlayerSticker = sticker.team !== "FWC" && sticker.number > 0;
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      className={`group relative aspect-[3/4] rounded-xl text-left overflow-hidden card card-interactive cursor-pointer ${statusRing(status)}`}
      aria-label={`${sticker.code} — ${sticker.name}`}
    >
      {isPlayerSticker && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/sticker-skeleton.svg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none select-none"
          draggable={false}
        />
      )}
      {sticker.isFoil && status !== "missing" && (
        <div className="absolute inset-0 foil-shimmer pointer-events-none" />
      )}
      <div className="absolute inset-0 flex flex-col p-2.5">
        <div className="flex items-start justify-between">
          <span
            className={`font-mono text-[10px] font-semibold tracking-wider ${
              status === "missing"
                ? "text-[color:var(--color-text-dim)]"
                : "text-[color:var(--color-text-muted)]"
            }`}
          >
            {sticker.code}
          </span>
          <StatusBadge status={status} extras={extras} compact={compact} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <div
            className={`font-bold tracking-tight leading-none flex flex-col items-center ${
              status === "missing"
                ? "text-[color:var(--color-text-dim)]"
                : sticker.isFoil
                  ? "text-[color:var(--color-foil)]"
                  : "text-[color:var(--color-text)]"
            }`}
          >
            <span
              className={`${compact ? "text-lg" : "text-xl"} font-mono tracking-wider`}
            >
              {sticker.team}
            </span>
            <span className={compact ? "text-2xl mt-0.5" : "text-3xl mt-0.5"}>
              {sticker.number}
            </span>
          </div>
          <div
            className={`font-semibold leading-tight line-clamp-3 text-center ${
              compact ? "text-sm" : "text-base"
            } ${
              status === "missing"
                ? "text-[color:var(--color-text-dim)]"
                : "text-[color:var(--color-text)]"
            }`}
          >
            {sticker.name}
          </div>
        </div>
        {sticker.isFoil && (
          <div className="mt-1">
            <span className="chip chip-foil !text-[9px] !py-0.5 !px-1.5">
              FOIL
            </span>
          </div>
        )}
      </div>

      {onQuickAdd && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd();
          }}
          aria-label={
            status === "missing"
              ? `Marcar ${sticker.code} como obtida`
              : `Adicionar mais uma de ${sticker.code}`
          }
          title={status === "missing" ? "Tenho!" : "+1 repetida"}
          className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-[color:var(--color-brand)] text-[#062b1f] flex items-center justify-center shadow-lg shadow-[color:var(--color-brand-glow)] opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100 hover:bg-emerald-300 transition-all"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
    </div>
  );
}

function statusRing(status: StickerStatus): string {
  switch (status) {
    case "owned":
      return "border-[color:var(--color-brand)]/55";
    case "duplicate":
      return "border-[color:var(--color-foil)]/60";
    case "missing":
    default:
      return "border-dashed";
  }
}

function StatusBadge({
  status,
  extras,
  compact,
}: {
  status: StickerStatus;
  extras: number;
  compact: boolean;
}) {
  if (status === "duplicate") {
    return (
      <span
        className={`chip chip-foil ${compact ? "!text-[9px] !py-0.5 !px-1.5" : ""}`}
      >
        +{extras}
      </span>
    );
  }
  if (status === "owned") {
    return (
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-[color:var(--color-brand)] text-[#062b1f]`}
        aria-label="Tenho"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3 h-3"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    );
  }
  return null;
}
