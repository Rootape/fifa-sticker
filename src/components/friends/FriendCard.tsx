"use client";

import Link from "next/link";

type Props = {
  id: string;
  name: string;
  ownedCount: number;
  spareCount: number;
  tradesAvailable: number;
  imported?: boolean;
};

export function FriendCard({
  id,
  name,
  ownedCount,
  spareCount,
  tradesAvailable,
  imported,
}: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <Link
      href={`/friends/${id}`}
      className="card card-interactive p-4 flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[color:var(--color-brand)] to-emerald-700 flex items-center justify-center text-lg font-bold text-[#062b1f] shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold tracking-tight truncate flex items-center gap-2">
          {name}
          {imported && (
            <span className="chip !text-[9px] !py-0.5 !px-1.5 bg-[color:var(--color-bg-elevated)] border-[color:var(--color-border)] text-[color:var(--color-text-muted)]">
              importado
            </span>
          )}
        </div>
        <div className="text-xs text-[color:var(--color-text-muted)] mt-0.5">
          {ownedCount} figurinha{ownedCount !== 1 ? "s" : ""} ·{" "}
          {spareCount} repetida{spareCount !== 1 ? "s" : ""}
        </div>
      </div>
      {tradesAvailable > 0 && (
        <span className="chip chip-brand shrink-0">
          {tradesAvailable} troca{tradesAvailable !== 1 ? "s" : ""}
        </span>
      )}
    </Link>
  );
}
