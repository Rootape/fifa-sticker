"use client";

import Link from "next/link";

type Props = {
  code: string;
  name: string;
  owned: number;
  total: number;
  duplicates: number;
};

export function TeamProgressCard({
  code,
  name,
  owned,
  total,
  duplicates,
}: Props) {
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
  const complete = total > 0 && owned === total;

  return (
    <Link
      href={`/team/${code}`}
      className={`card card-interactive p-4 block relative overflow-hidden ${
        complete ? "border-[color:var(--color-brand)]/55" : ""
      }`}
    >
      {complete && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[color:var(--color-brand)]/15 to-transparent pointer-events-none" />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-widest text-[color:var(--color-text-muted)]">
            {code}
          </div>
          <div className="font-semibold text-[15px] tracking-tight mt-0.5 truncate">
            {name}
          </div>
        </div>
        {complete ? (
          <span className="chip chip-brand">Completo</span>
        ) : duplicates > 0 ? (
          <span className="chip chip-foil">+{duplicates}</span>
        ) : null}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-sm font-medium">
            <span className="text-[color:var(--color-text)]">{owned}</span>
            <span className="text-[color:var(--color-text-muted)]">
              /{total}
            </span>
          </span>
          <span className="text-xs text-[color:var(--color-text-muted)]">
            {pct}%
          </span>
        </div>
        <div className="progress">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}
