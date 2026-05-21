"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Sticker, StickersData } from "@/types";
import { useFriends } from "@/hooks/useFriends";
import { useCollection } from "@/hooks/useCollection";
import { AddDuplicateModal } from "@/components/friends/AddDuplicateModal";
import { ImportCodeModal } from "@/components/friends/ImportCodeModal";

type Props = {
  friendId: string;
  data: StickersData;
};

export function FriendDetailView({ friendId, data }: Props) {
  const router = useRouter();
  const {
    friends,
    getFriend,
    renameFriend,
    removeFriend,
    setStickerQuantity,
    incrementSticker,
    importFriend,
    replaceFriendStickers,
    loaded: friendsLoaded,
  } = useFriends();
  const { entries, loaded: collectionLoaded } = useCollection();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  const friend = getFriend(friendId);
  const stickerMap = useMemo(() => {
    const m = new Map<string, Sticker>();
    data.stickers.forEach((s) => m.set(s.id, s));
    return m;
  }, [data.stickers]);

  const ownedSet = useMemo(() => {
    const s = new Set<string>();
    entries.forEach((e) => {
      if (e.owned) s.add(e.stickerId);
    });
    return s;
  }, [entries]);

  if (!friendsLoaded || !collectionLoaded) {
    return <div className="text-[color:var(--color-text-muted)]">Carregando...</div>;
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

  const stickersDetailed = friend.stickers
    .map((d) => ({ ...d, sticker: stickerMap.get(d.stickerId) }))
    .filter((d): d is typeof d & { sticker: Sticker } => Boolean(d.sticker));

  const trades = stickersDetailed.filter(
    (d) => d.quantity >= 2 && !ownedSet.has(d.stickerId),
  );
  const tradesByTeam = trades.reduce<Record<string, typeof trades>>(
    (acc, t) => {
      const team = t.sticker.team;
      (acc[team] ??= []).push(t);
      return acc;
    },
    {},
  );

  const totalOwned = stickersDetailed.length;
  const totalSpares = stickersDetailed.reduce(
    (s, d) => s + Math.max(0, d.quantity - 1),
    0,
  );
  const isImported = Boolean(friend.importedAt);

  const initial = friend.name.trim().charAt(0).toUpperCase() || "?";

  const saveName = () => {
    const v = nameValue.trim();
    if (v) renameFriend(friend.id, v);
    setEditingName(false);
  };

  const handleRemove = () => {
    removeFriend(friend.id);
    router.push("/friends");
  };

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
          <Stat label="Coleção" value={totalOwned} accent="muted" />
          <Stat label="Repetidas" value={totalSpares} accent="muted" />
          <Stat label="Trocas" value={trades.length} accent="brand" />
        </div>
      </section>

      {trades.length > 0 && (
        <section className="card p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Sugestões de troca
            </h2>
            <span className="chip chip-brand">
              {trades.length} disponíve{trades.length !== 1 ? "is" : "l"}
            </span>
          </div>
          <p className="text-sm text-[color:var(--color-text-muted)] mb-4">
            Figurinhas que você não tem e {friend.name} tem repetidas pra
            passar.
          </p>
          <div className="space-y-4">
            {Object.entries(tradesByTeam).map(([team, items]) => (
              <div key={team}>
                <div className="text-[11px] font-bold tracking-widest text-[color:var(--color-text-muted)] mb-2">
                  {team} · {data.teams[team] ?? team}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items
                    .sort((a, b) => a.sticker.number - b.sticker.number)
                    .map((t) => (
                      <div
                        key={t.stickerId}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                          t.sticker.isFoil
                            ? "bg-[color:var(--color-foil-soft)] border-[color:var(--color-foil)]/40 text-[color:var(--color-foil)]"
                            : "bg-[color:var(--color-bg-elevated)] border-[color:var(--color-border)]"
                        }`}
                        title={t.sticker.name}
                      >
                        <span className="font-mono">#{t.sticker.number}</span>{" "}
                        <span className="opacity-80">{t.sticker.name}</span>
                        {t.quantity > 2 && (
                          <span className="ml-1.5 opacity-60">
                            ×{t.quantity - 1}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Figurinhas de {friend.name}
          </h2>
          {!isImported && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="btn btn-primary"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Adicionar
            </button>
          )}
        </div>

        {stickersDetailed.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-3xl mb-2">📋</div>
            <div className="font-semibold tracking-tight">
              Nenhuma figurinha cadastrada
            </div>
            <p className="text-sm text-[color:var(--color-text-muted)] mt-1">
              {isImported
                ? "A coleção compartilhada parece vazia."
                : "Adicione figurinhas que esse amigo possui para identificar trocas."}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {stickersDetailed
              .sort((a, b) => {
                if (a.sticker.team !== b.sticker.team)
                  return a.sticker.team.localeCompare(b.sticker.team);
                return a.sticker.number - b.sticker.number;
              })
              .map((d) => {
                const isTradeable = d.quantity >= 2 && !ownedSet.has(d.stickerId);
                return (
                  <div
                    key={d.stickerId}
                    className="card p-3 flex items-center gap-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                        d.sticker.isFoil
                          ? "bg-[color:var(--color-foil-soft)] text-[color:var(--color-foil)]"
                          : "bg-[color:var(--color-bg-elevated)]"
                      }`}
                    >
                      #{d.sticker.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-2">
                        {d.sticker.name}
                        {isTradeable && (
                          <span className="chip chip-brand !text-[9px] !py-0.5 !px-1.5">
                            Troca
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[color:var(--color-text-muted)] truncate">
                        {d.sticker.country} ·{" "}
                        <span className="font-mono">{d.sticker.code}</span>
                      </div>
                    </div>
                    {isImported ? (
                      <div className="shrink-0 text-sm font-bold tabular-nums text-[color:var(--color-text-muted)] w-10 text-center">
                        ×{d.quantity}
                      </div>
                    ) : (
                      <>
                        <QtyControl
                          value={d.quantity}
                          onDec={() =>
                            setStickerQuantity(
                              friend.id,
                              d.stickerId,
                              d.quantity - 1,
                            )
                          }
                          onInc={() =>
                            setStickerQuantity(
                              friend.id,
                              d.stickerId,
                              d.quantity + 1,
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setStickerQuantity(friend.id, d.stickerId, 0)
                          }
                          className="text-[color:var(--color-text-dim)] hover:text-[color:var(--color-danger)] p-1.5"
                          aria-label="Remover"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          >
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
          </div>
        )}
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

      {showAdd && (
        <AddDuplicateModal
          friend={friend}
          stickers={data.stickers}
          teams={data.teams}
          onAdd={(stickerId) => incrementSticker(friend.id, stickerId)}
          onClose={() => setShowAdd(false)}
        />
      )}

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

function QtyControl({
  value,
  onDec,
  onInc,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={onDec}
        className="w-7 h-7 rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-hover)] flex items-center justify-center"
        aria-label="Diminuir"
      >
        −
      </button>
      <div className="w-7 text-center text-sm font-bold tabular-nums">
        {value}
      </div>
      <button
        type="button"
        onClick={onInc}
        className="w-7 h-7 rounded-full border border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-hover)] flex items-center justify-center"
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  );
}
