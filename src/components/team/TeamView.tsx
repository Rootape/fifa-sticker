"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Sticker, StickerStatus } from "@/types";
import { useCollection } from "@/hooks/useCollection";
import { StickerCard } from "@/components/sticker/StickerCard";
import { StickerModal } from "@/components/sticker/StickerModal";
import { TeamFlag } from "@/components/team/TeamFlag";

type TeamRef = { code: string; name: string };

type Props = {
  teamCode: string;
  teamName: string;
  stickers: Sticker[];
  allTeams: TeamRef[];
};

export function TeamView({ teamCode, teamName, stickers, allTeams }: Props) {
  const router = useRouter();
  const { getEntry, setEntry, increment } = useCollection();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeChipRef = useRef<HTMLAnchorElement>(null);

  const enriched = useMemo(() => {
    return stickers.map((s) => {
      const entry = getEntry(s.id);
      const quantity = entry?.quantity ?? 0;
      const status: StickerStatus = !entry?.owned
        ? "missing"
        : quantity > 1
          ? "duplicate"
          : "owned";
      return { sticker: s, status, quantity };
    });
  }, [stickers, getEntry]);

  const ownedCount = enriched.filter((e) => e.status !== "missing").length;
  const dupCount = enriched.reduce(
    (sum, e) => sum + Math.max(0, e.quantity - 1),
    0,
  );
  const pct =
    stickers.length > 0 ? Math.round((ownedCount / stickers.length) * 100) : 0;
  const complete = ownedCount === stickers.length;

  const selected = selectedId
    ? enriched.find((e) => e.sticker.id === selectedId)
    : null;

  const currentIndex = allTeams.findIndex((t) => t.code === teamCode);
  const prev = currentIndex > 0 ? allTeams[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < allTeams.length - 1
      ? allTeams[currentIndex + 1]
      : null;

  useEffect(() => {
    activeChipRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [teamCode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedId) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === "ArrowLeft" && prev) router.push(`/team/${prev.code}`);
      if (e.key === "ArrowRight" && next) router.push(`/team/${next.code}`);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [prev, next, router, selectedId]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="text-xs text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] inline-flex items-center gap-1"
        >
          ← Voltar
        </Link>
        <span className="text-[10px] text-[color:var(--color-text-dim)] font-mono hidden md:inline">
          {currentIndex + 1}/{allTeams.length} · use ← →
        </span>
      </div>

      <section className="card p-5 relative">
        {complete ? (
          <span className="absolute top-3 right-3 chip chip-brand">Completo</span>
        ) : dupCount > 0 ? (
          <span className="absolute top-3 right-3 chip chip-foil">+{dupCount}</span>
        ) : null}
        <div className="flex items-center justify-center gap-3">
          <NavArrow
            href={prev ? `/team/${prev.code}` : null}
            direction="prev"
            label={prev?.name}
          />
          <div className="flex items-center justify-center gap-3 w-[240px] sm:w-[300px]">
            <TeamFlag teamCode={teamCode} teamName={teamName} size={56} />
            <div className="min-w-0 text-center">
              <div className="font-mono text-xs tracking-widest text-[color:var(--color-text-muted)]">
                {teamCode}
              </div>
              <h1 className="text-2xl font-bold tracking-tight mt-1 truncate">
                {teamName}
              </h1>
            </div>
          </div>
          <NavArrow
            href={next ? `/team/${next.code}` : null}
            direction="next"
            label={next?.name}
          />
        </div>
        <div className="mt-4 flex items-baseline justify-between mb-1.5">
          <span className="text-sm font-medium">
            <span>{ownedCount}</span>
            <span className="text-[color:var(--color-text-muted)]">
              /{stickers.length}
            </span>
          </span>
          <span className="text-xs text-[color:var(--color-text-muted)]">
            {pct}%
          </span>
        </div>
        <div className="progress">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
      </section>

      <div className="-mx-4 px-4 overflow-x-auto scrollbar-thin">
        <div className="flex gap-1.5 min-w-max pb-1">
          {allTeams.map((t) => {
            const active = t.code === teamCode;
            return (
              <Link
                key={t.code}
                href={`/team/${t.code}`}
                ref={active ? activeChipRef : undefined}
                title={t.name}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors font-mono ${
                  active
                    ? "bg-[color:var(--color-brand)] text-[#062b1f] border-transparent"
                    : "bg-[color:var(--color-surface)] border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-hover)]"
                }`}
              >
                {t.code}
              </Link>
            );
          })}
        </div>
      </div>

      <section>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
          {enriched.map(({ sticker, status, quantity }) => (
            <StickerCard
              key={sticker.id}
              sticker={sticker}
              status={status}
              quantity={quantity}
              onClick={() => setSelectedId(sticker.id)}
              onQuickAdd={() => increment(sticker.id)}
              compact
            />
          ))}
        </div>
      </section>

      {selected && (
        <StickerModal
          sticker={selected.sticker}
          initialOwned={selected.status !== "missing"}
          initialQuantity={selected.quantity}
          onClose={() => setSelectedId(null)}
          onSave={(owned, quantity) =>
            setEntry(selected.sticker.id, owned, quantity)
          }
        />
      )}
    </div>
  );
}

function NavArrow({
  href,
  direction,
  label,
}: {
  href: string | null;
  direction: "prev" | "next";
  label?: string;
}) {
  const baseClass =
    "shrink-0 w-9 h-9 rounded-full border border-[color:var(--color-border)] flex items-center justify-center transition-colors";
  const Icon = (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "prev" ? (
        <path d="m15 18-6-6 6-6" />
      ) : (
        <path d="m9 18 6-6-6-6" />
      )}
    </svg>
  );
  if (!href) {
    return (
      <span
        aria-hidden
        className={`${baseClass} opacity-30 text-[color:var(--color-text-dim)]`}
      >
        {Icon}
      </span>
    );
  }
  return (
    <Link
      href={href}
      title={label}
      aria-label={direction === "prev" ? "Seleção anterior" : "Próxima seleção"}
      className={`${baseClass} text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-hover)] hover:border-[color:var(--color-border-strong)]`}
    >
      {Icon}
    </Link>
  );
}
