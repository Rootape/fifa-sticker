"use client";

import { useMemo, useState } from "react";
import type { StickersData } from "@/types";
import { useFriends } from "@/hooks/useFriends";
import { useCollection } from "@/hooks/useCollection";
import { FriendCard } from "@/components/friends/FriendCard";
import { ExportCodeModal } from "@/components/friends/ExportCodeModal";
import { ImportCodeModal } from "@/components/friends/ImportCodeModal";

type Props = { data: StickersData };

export function FriendsView({ data }: Props) {
  const {
    friends,
    loaded: friendsLoaded,
    addFriend,
    importFriend,
    replaceFriendStickers,
  } = useFriends();
  const { entries, loaded: collectionLoaded } = useCollection();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const ownedSet = useMemo(() => {
    const s = new Set<string>();
    entries.forEach((e) => {
      if (e.owned) s.add(e.stickerId);
    });
    return s;
  }, [entries]);

  const decorated = useMemo(() => {
    return friends.map((f) => {
      const ownedCount = f.stickers.length;
      const spareCount = f.stickers.reduce(
        (s, d) => s + Math.max(0, d.quantity - 1),
        0,
      );
      const trades = f.stickers.filter(
        (d) => d.quantity >= 2 && !ownedSet.has(d.stickerId),
      ).length;
      return {
        friend: f,
        ownedCount,
        spareCount,
        trades,
      };
    });
  }, [friends, ownedSet]);

  const totalTrades = decorated.reduce((s, f) => s + f.trades, 0);
  const loaded = friendsLoaded && collectionLoaded;

  const submit = () => {
    const v = name.trim();
    if (!v) return;
    addFriend(v);
    setName("");
    setAdding(false);
  };

  const myQuantities = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      if (e.owned) map.set(e.stickerId, e.quantity);
    }
    return map;
  }, [entries]);

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs font-medium text-[color:var(--color-brand)] uppercase tracking-wider">
            Amigos
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Trocas</h1>
          <p className="text-sm text-[color:var(--color-text-muted)] mt-1">
            {loaded && friends.length > 0
              ? `${friends.length} amigo${friends.length > 1 ? "s" : ""} · ${totalTrades} troca${totalTrades !== 1 ? "s" : ""} disponíve${totalTrades !== 1 ? "is" : "l"}`
              : "Cadastre amigos e suas repetidas para encontrar trocas"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowExport(true)}
            className="btn btn-ghost"
            title="Gerar código da minha coleção"
          >
            <ShareIcon className="w-4 h-4" />
            Meu código
          </button>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="btn btn-ghost"
            title="Importar código de um amigo"
          >
            <ImportIcon className="w-4 h-4" />
            Importar
          </button>
          <button
            type="button"
            onClick={() => setAdding(true)}
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
        </div>
      </header>

      {adding && (
        <div className="card p-4 animate-fade-in">
          <label className="text-sm font-medium block mb-2">
            Nome do amigo
          </label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") {
                setAdding(false);
                setName("");
              }
            }}
            placeholder="Ex: João, Mariana..."
            className="input"
          />
          <div className="mt-3 flex gap-2 justify-end">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setAdding(false);
                setName("");
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!name.trim()}
              onClick={submit}
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {loaded && friends.length === 0 && !adding && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🤝</div>
          <div className="font-semibold tracking-tight">
            Nenhum amigo cadastrado
          </div>
          <p className="text-sm text-[color:var(--color-text-muted)] mt-1 max-w-sm mx-auto">
            Adicione amigos e cadastre as repetidas deles, ou importe a coleção
            de alguém usando um código compartilhado.
          </p>
        </div>
      )}

      {decorated.length > 0 && (
        <div className="space-y-2.5">
          {decorated.map(({ friend, ownedCount, spareCount, trades }) => (
            <FriendCard
              key={friend.id}
              id={friend.id}
              name={friend.name}
              ownedCount={ownedCount}
              spareCount={spareCount}
              tradesAvailable={trades}
              imported={Boolean(friend.importedAt)}
            />
          ))}
        </div>
      )}

      {showExport && (
        <ExportCodeModal
          stickers={data.stickers}
          quantities={myQuantities}
          onClose={() => setShowExport(false)}
        />
      )}
      {showImport && (
        <ImportCodeModal
          stickers={data.stickers}
          existingFriends={friends}
          onImportNew={importFriend}
          onReplace={replaceFriendStickers}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

function ShareIcon({ className }: { className?: string }) {
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

function ImportIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}
