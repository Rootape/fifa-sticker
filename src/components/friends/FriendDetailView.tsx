"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Sticker, StickersData } from "@/types";
import { useFriends } from "@/hooks/useFriends";
import { useCollection } from "@/hooks/useCollection";
import { ImportCodeModal } from "@/components/friends/ImportCodeModal";

const PROFILE_NAME_KEY = "fifa:profile-name";

type Props = {
  friendId: string;
  data: StickersData;
};

type TradeItem = {
  sticker: Sticker;
  ownerQuantity: number;
};

export function FriendDetailView({ friendId, data }: Props) {
  const router = useRouter();
  const {
    friends,
    getFriend,
    renameFriend,
    removeFriend,
    importFriend,
    replaceFriendStickers,
    loaded: friendsLoaded,
  } = useFriends();
  const { entries, loaded: collectionLoaded } = useCollection();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [tradeGive, setTradeGive] = useState<Set<string>>(new Set());
  const [tradeReceive, setTradeReceive] = useState<Set<string>>(new Set());
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_NAME_KEY);
      if (stored) setProfileName(stored);
    } catch {}
  }, []);

  const friend = getFriend(friendId);

  const stickerMap = useMemo(() => {
    const m = new Map<string, Sticker>();
    data.stickers.forEach((s) => m.set(s.id, s));
    return m;
  }, [data.stickers]);

  const myQuantities = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) {
      if (e.owned && e.quantity >= 1) m.set(e.stickerId, e.quantity);
    }
    return m;
  }, [entries]);

  const friendQuantities = useMemo(() => {
    const m = new Map<string, number>();
    if (!friend) return m;
    for (const s of friend.stickers) {
      if (s.quantity >= 1) m.set(s.stickerId, s.quantity);
    }
    return m;
  }, [friend]);

  const { receiveCandidates, giveCandidates } = useMemo(() => {
    if (!friend)
      return { receiveCandidates: [], giveCandidates: [] } as {
        receiveCandidates: TradeItem[];
        giveCandidates: TradeItem[];
      };
    const receive: TradeItem[] = [];
    const give: TradeItem[] = [];
    for (const s of data.stickers) {
      const friendQ = friendQuantities.get(s.id) ?? 0;
      const myQ = myQuantities.get(s.id) ?? 0;
      if (friendQ >= 2 && myQ === 0) {
        receive.push({ sticker: s, ownerQuantity: friendQ });
      }
      if (myQ >= 2 && friendQ === 0) {
        give.push({ sticker: s, ownerQuantity: myQ });
      }
    }
    const sorter = (a: TradeItem, b: TradeItem) => {
      if (a.sticker.team !== b.sticker.team)
        return a.sticker.team.localeCompare(b.sticker.team);
      return a.sticker.number - b.sticker.number;
    };
    receive.sort(sorter);
    give.sort(sorter);
    return { receiveCandidates: receive, giveCandidates: give };
  }, [friend, data.stickers, friendQuantities, myQuantities]);

  if (!friendsLoaded || !collectionLoaded) {
    return (
      <div className="text-[color:var(--color-text-muted)]">Carregando...</div>
    );
  }

  if (!friend) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Link
          href="/friends"
          className="text-xs text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] inline-flex items-center gap-1"
        >
          ← Amigos
        </Link>
        <div className="card p-6 text-center">
          <div className="font-semibold">Amigo não encontrado</div>
          <p className="text-sm text-[color:var(--color-text-muted)] mt-1">
            Pode ter sido removido.
          </p>
        </div>
      </div>
    );
  }

  const friendOwnedCount = friend.stickers.length;
  const friendSpareCount = friend.stickers.reduce(
    (s, d) => s + Math.max(0, d.quantity - 1),
    0,
  );
  const isImported = Boolean(friend.importedAt);
  const initial = friend.name.trim().charAt(0).toUpperCase() || "?";

  const tradeGiveItems = giveCandidates.filter((t) =>
    tradeGive.has(t.sticker.id),
  );
  const tradeReceiveItems = receiveCandidates.filter((t) =>
    tradeReceive.has(t.sticker.id),
  );

  const toggleGive = (id: string) => {
    setTradeGive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleReceive = (id: string) => {
    setTradeReceive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearTrade = () => {
    setTradeGive(new Set());
    setTradeReceive(new Set());
  };

  const saveName = () => {
    const v = nameValue.trim();
    if (v) renameFriend(friend.id, v);
    setEditingName(false);
  };

  const handleRemove = () => {
    removeFriend(friend.id);
    router.push("/friends");
  };

  const myDisplayName = profileName.trim() || "Eu";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link
          href="/friends"
          className="text-xs text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] inline-flex items-center gap-1"
        >
          ← Amigos
        </Link>
      </div>

      <section className="card p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[color:var(--color-brand)] to-emerald-700 flex items-center justify-center text-xl font-bold text-[#062b1f] shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="input"
                />
                <button
                  type="button"
                  onClick={saveName}
                  className="btn btn-primary"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameValue(friend.name);
                  setEditingName(true);
                }}
                className="text-left group"
              >
                <h1 className="text-2xl font-bold tracking-tight group-hover:text-[color:var(--color-brand)] transition-colors flex items-center gap-2 flex-wrap">
                  {friend.name}
                  {isImported && (
                    <span className="chip !text-[10px] !py-0.5 !px-2 bg-[color:var(--color-bg-elevated)] border-[color:var(--color-border)] text-[color:var(--color-text-muted)]">
                      importado
                    </span>
                  )}
                </h1>
                <div className="text-xs text-[color:var(--color-text-muted)] mt-0.5 group-hover:text-[color:var(--color-text)] transition-colors">
                  {isImported
                    ? `Atualizado ${formatRelative(friend.importedAt!)}`
                    : "Tocar para renomear"}
                </div>
              </button>
            )}
          </div>
          {isImported && (
            <button
              type="button"
              onClick={() => setShowUpdate(true)}
              className="btn btn-ghost !py-1.5 !px-3 text-xs shrink-0"
              title="Atualizar com novo código"
            >
              Atualizar
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat label="Coleção" value={friendOwnedCount} accent="muted" />
          <Stat label="Repetidas" value={friendSpareCount} accent="muted" />
          <Stat
            label="Trocas"
            value={receiveCandidates.length + giveCandidates.length}
            accent="brand"
          />
        </div>
      </section>

      {!isImported && (
        <section className="card p-4 border-[color:var(--color-foil)]/30 bg-[color:var(--color-foil-soft)]/30">
          <div className="text-sm">
            <div className="font-semibold text-[color:var(--color-foil)] mb-1">
              Coleção incompleta
            </div>
            <div className="text-[color:var(--color-text-muted)]">
              Este amigo foi cadastrado antes do fluxo de importação por
              código. Peça o código atualizado pra ele e use{" "}
              <button
                type="button"
                onClick={() => setShowUpdate(true)}
                className="underline hover:text-[color:var(--color-text)]"
              >
                Atualizar
              </button>{" "}
              pra ativar o construtor de trocas.
            </div>
          </div>
        </section>
      )}

      <TradeSummary
        myName={myDisplayName}
        friendName={friend.name}
        giveItems={tradeGiveItems}
        receiveItems={tradeReceiveItems}
        teams={data.teams}
        onRemoveGive={toggleGive}
        onRemoveReceive={toggleReceive}
        onClear={clearTrade}
        hasAnyCandidate={
          receiveCandidates.length > 0 || giveCandidates.length > 0
        }
      />

      <section>
        <div className="grid md:grid-cols-2 gap-4">
          <TradeColumn
            variant="receive"
            title={`${friend.name} te dá`}
            subtitle="Repetidas dele que você não tem"
            candidates={receiveCandidates}
            selected={tradeReceive}
            onToggle={toggleReceive}
            teams={data.teams}
            emptyMessage={
              isImported
                ? `${friend.name} não tem repetidas que você precise no momento.`
                : "Importe a coleção completa pra ver as repetidas dele."
            }
          />
          <TradeColumn
            variant="give"
            title="Você dá pra ele"
            subtitle="Suas repetidas que ele não tem"
            candidates={giveCandidates}
            selected={tradeGive}
            onToggle={toggleGive}
            teams={data.teams}
            emptyMessage={
              isImported
                ? `Você não tem repetidas que ${friend.name} precise.`
                : "Importe a coleção completa pra ver o que oferecer."
            }
          />
        </div>
      </section>

      <section className="card p-4 border-[color:var(--color-danger)]/30">
        {confirmRemove ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm">
              Tem certeza? Esta ação não pode ser desfeita.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="btn btn-danger !bg-[color:var(--color-danger-soft)]"
              >
                Remover amigo
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="btn btn-danger w-full"
          >
            Remover {friend.name}
          </button>
        )}
      </section>

      {showUpdate && (
        <ImportCodeModal
          stickers={data.stickers}
          existingFriends={friends}
          targetFriendId={friend.id}
          onImportNew={importFriend}
          onReplace={replaceFriendStickers}
          onClose={() => setShowUpdate(false)}
        />
      )}
    </div>
  );
}

function TradeSummary({
  myName,
  friendName,
  giveItems,
  receiveItems,
  teams,
  onRemoveGive,
  onRemoveReceive,
  onClear,
  hasAnyCandidate,
}: {
  myName: string;
  friendName: string;
  giveItems: TradeItem[];
  receiveItems: TradeItem[];
  teams: Record<string, string>;
  onRemoveGive: (id: string) => void;
  onRemoveReceive: (id: string) => void;
  onClear: () => void;
  hasAnyCandidate: boolean;
}) {
  const total = giveItems.length + receiveItems.length;
  const isEmpty = total === 0;

  return (
    <section
      className="card p-5 relative overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(135deg, color-mix(in oklab, var(--color-brand-soft) 40%, transparent), color-mix(in oklab, var(--color-foil-soft) 25%, transparent))",
        borderColor: "color-mix(in oklab, var(--color-brand) 30%, var(--color-border))",
      }}
    >
      <header className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-[color:var(--color-text-muted)] uppercase">
            Proposta de troca
          </div>
          <div className="text-xl font-bold tracking-tight mt-1 flex items-center gap-2 flex-wrap">
            <span>{myName}</span>
            <span className="text-[color:var(--color-text-muted)] text-base">
              ×
            </span>
            <span>{friendName}</span>
          </div>
        </div>
        {!isEmpty && (
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold tabular-nums">
              {giveItems.length}{" "}
              <span className="text-[color:var(--color-text-muted)]">↔</span>{" "}
              {receiveItems.length}
            </div>
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] underline"
            >
              Limpar
            </button>
          </div>
        )}
      </header>

      {isEmpty ? (
        <div className="text-sm text-[color:var(--color-text-muted)]">
          {hasAnyCandidate
            ? "Escolha figurinhas abaixo pra montar uma proposta. Você pode tirar print desse card e mandar pro amigo."
            : "Sem trocas possíveis com este amigo no momento."}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <TradeBucket
            label={`${myName} oferece`}
            count={giveItems.length}
            accent="foil"
            items={giveItems}
            teams={teams}
            onRemove={onRemoveGive}
            emptyLabel="Nada selecionado"
          />
          <TradeBucket
            label={`${myName} recebe`}
            count={receiveItems.length}
            accent="brand"
            items={receiveItems}
            teams={teams}
            onRemove={onRemoveReceive}
            emptyLabel="Nada selecionado"
          />
        </div>
      )}
    </section>
  );
}

function TradeBucket({
  label,
  count,
  accent,
  items,
  teams,
  onRemove,
  emptyLabel,
}: {
  label: string;
  count: number;
  accent: "brand" | "foil";
  items: TradeItem[];
  teams: Record<string, string>;
  onRemove: (id: string) => void;
  emptyLabel: string;
}) {
  const accentColor =
    accent === "brand"
      ? "text-[color:var(--color-brand)]"
      : "text-[color:var(--color-foil)]";
  return (
    <div className="rounded-xl bg-[color:var(--color-bg)]/40 border border-[color:var(--color-border)] p-3">
      <div className="flex items-baseline justify-between mb-2">
        <div className={`text-[10px] font-bold tracking-widest uppercase ${accentColor}`}>
          {label}
        </div>
        <div className="text-xs font-semibold tabular-nums">{count}</div>
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-[color:var(--color-text-muted)]">
          {emptyLabel}
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((t) => (
            <li
              key={t.sticker.id}
              className="flex items-center gap-2 group"
              title={teams[t.sticker.team] ?? t.sticker.team}
            >
              <span className="font-mono text-[10px] text-[color:var(--color-text-muted)] w-12 shrink-0">
                {t.sticker.code}
              </span>
              <span className="text-sm flex-1 min-w-0 truncate">
                {t.sticker.name}
              </span>
              <button
                type="button"
                onClick={() => onRemove(t.sticker.id)}
                aria-label={`Remover ${t.sticker.name}`}
                className="opacity-40 hover:opacity-100 group-hover:opacity-100 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-danger)] p-0.5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TradeColumn({
  variant,
  title,
  subtitle,
  candidates,
  selected,
  onToggle,
  teams,
  emptyMessage,
}: {
  variant: "receive" | "give";
  title: string;
  subtitle: string;
  candidates: TradeItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  teams: Record<string, string>;
  emptyMessage: string;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, TradeItem[]>();
    for (const c of candidates) {
      const arr = map.get(c.sticker.team) ?? [];
      arr.push(c);
      map.set(c.sticker.team, arr);
    }
    return Array.from(map.entries());
  }, [candidates]);

  const accentColor =
    variant === "receive"
      ? "text-[color:var(--color-brand)]"
      : "text-[color:var(--color-foil)]";

  return (
    <div className="card p-4">
      <div className="mb-3">
        <div className={`text-[10px] font-bold tracking-widest uppercase ${accentColor}`}>
          {title}
        </div>
        <div className="text-xs text-[color:var(--color-text-muted)] mt-0.5">
          {subtitle}
        </div>
        <div className="text-xs text-[color:var(--color-text-muted)] mt-1 tabular-nums">
          {candidates.length} disponíve{candidates.length !== 1 ? "is" : "l"}
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="text-sm text-[color:var(--color-text-muted)] py-6 text-center">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
          {grouped.map(([teamCode, items]) => (
            <div key={teamCode}>
              <div className="text-[10px] font-bold tracking-widest text-[color:var(--color-text-muted)] mb-1.5">
                {teamCode} · {teams[teamCode] ?? teamCode}
              </div>
              <ul className="space-y-1">
                {items.map((t) => {
                  const isSelected = selected.has(t.sticker.id);
                  return (
                    <li key={t.sticker.id}>
                      <button
                        type="button"
                        onClick={() => onToggle(t.sticker.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${
                          isSelected
                            ? variant === "receive"
                              ? "bg-[color:var(--color-brand-soft)]/50 border-[color:var(--color-brand)]/40"
                              : "bg-[color:var(--color-foil-soft)]/60 border-[color:var(--color-foil)]/40"
                            : "bg-[color:var(--color-bg-elevated)] border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)]"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                            t.sticker.isFoil
                              ? "bg-[color:var(--color-foil-soft)] text-[color:var(--color-foil)]"
                              : "bg-[color:var(--color-bg)] text-[color:var(--color-text)]"
                          }`}
                        >
                          #{t.sticker.number}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium truncate">
                            {t.sticker.name}
                          </span>
                          <span className="block text-[11px] text-[color:var(--color-text-muted)] truncate">
                            <span className="font-mono">{t.sticker.code}</span>
                            {t.ownerQuantity > 2 && (
                              <span className="ml-2">
                                ×{t.ownerQuantity - 1} repetida
                                {t.ownerQuantity - 1 > 1 ? "s" : ""}
                              </span>
                            )}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border ${
                            isSelected
                              ? variant === "receive"
                                ? "bg-[color:var(--color-brand)] text-[#062b1f] border-transparent"
                                : "bg-[color:var(--color-foil)] text-[#2a1e07] border-transparent"
                              : "border-[color:var(--color-border)] text-[color:var(--color-text-muted)]"
                          }`}
                          aria-hidden
                        >
                          {isSelected ? "✓" : "+"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  return new Date(ts).toLocaleDateString("pt-BR");
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "brand" | "foil" | "muted";
}) {
  const color =
    accent === "brand"
      ? "text-[color:var(--color-brand)]"
      : accent === "foil"
        ? "text-[color:var(--color-foil)]"
        : "text-[color:var(--color-text)]";
  return (
    <div className="p-3 rounded-xl bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border)]">
      <div className={`text-xl font-bold tracking-tight ${color}`}>{value}</div>
      <div className="text-[10px] font-medium text-[color:var(--color-text-muted)] uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}
