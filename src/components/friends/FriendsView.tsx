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
    importFriend,
    replaceFriendStickers,
  } = useFriends();
  const { entries, loaded: collectionLoaded } = useCollection();
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
              : "Importe a coleção de um amigo pra começar a montar trocas"}
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
            className="btn btn-primary"
            title="Importar código de um amigo"
          >
            <ImportIcon className="w-4 h-4" />
            Importar amigo
          </button>
        </div>
      </header>

      {loaded && friends.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🤝</div>
          <div className="font-semibold tracking-tight">
            Nenhum amigo importado
          </div>
          <p className="text-sm text-[color:var(--color-text-muted)] mt-1 max-w-sm mx-auto">
            Peça o código da coleção pra um amigo (botão "Meu código") e
            importe aqui pra montar trocas com base nas duplicadas de cada um.
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
