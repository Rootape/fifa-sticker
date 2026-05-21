"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Coleção" },
  { href: "/missing", label: "Faltantes" },
  { href: "/duplicates", label: "Repetidas" },
  { href: "/friends", label: "Amigos" },
  { href: "/search", label: "Buscar" },
  { href: "/catalog", label: "Catálogo" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
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

        <Link
          href="/search"
          aria-label="Buscar"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)]"
        >
          <SearchIcon className="w-4 h-4" />
        </Link>
      </div>
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
