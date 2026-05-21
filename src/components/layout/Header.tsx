"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCollection } from "@/hooks/useCollection";
import { RestoreCodeModal } from "@/components/collection/RestoreCodeModal";

const NAV_LINKS = [
  { href: "/", label: "Coleção" },
  { href: "/missing", label: "Faltantes" },
  { href: "/duplicates", label: "Repetidas" },
  { href: "/friends", label: "Amigos" },
  { href: "/search", label: "Buscar" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const { entries, replaceEntries } = useCollection();
  const [showRestore, setShowRestore] = useState(false);

  const { ownedCount, spareCount } = useMemo(() => {
    let owned = 0;
    let spares = 0;
    for (const e of entries) {
      if (e.owned && e.quantity >= 1) {
        owned++;
        if (e.quantity >= 2) spares += e.quantity - 1;
      }
    }
    return { ownedCount: owned, spareCount: spares };
  }, [entries]);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--color-bg)]/75 border-b border-[color:var(--color-border)]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[color:var(--color-brand)] to-emerald-700 flex items-center justify-center font-bold text-[color:#062b1f] shadow-lg shadow-[color:var(--color-brand-glow)]">
            <span className="text-base leading-none">FIFA</span>
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">
              Album da Copa Panini 2026
            </div>
            <div className="text-[11px] text-[color:var(--color-text-muted)] -mt-0.5">
              Minha coleção
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? "bg-[color:var(--color-brand-soft)] text-emerald-300"
                      : "text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-surface)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setShowRestore(true)}
            aria-label="Restaurar coleção"
            title="Restaurar coleção a partir de um código"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-surface)]"
          >
            <KeyIcon className="w-4 h-4" />
          </button>

          <Link
            href="/search"
            aria-label="Buscar"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)]"
          >
            <SearchIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {showRestore && (
        <RestoreCodeModal
          currentOwned={ownedCount}
          currentSpares={spareCount}
          onRestore={replaceEntries}
          onClose={() => setShowRestore(false)}
        />
      )}
    </header>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7.5" cy="15.5" r="3.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}
