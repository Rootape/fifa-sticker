"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Friend, FriendSticker } from "@/types";

const ENDPOINT = "/api/friends";

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(ENDPOINT)
      .then((r) => r.json())
      .then((data: Friend[]) => {
        if (!cancelled) {
          setFriends(Array.isArray(data) ? data : []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(friends),
      }).catch(() => {});
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [friends, loaded]);

  const addFriend = useCallback((name: string): Friend => {
    const friend: Friend = {
      id: crypto.randomUUID(),
      name: name.trim(),
      stickers: [],
    };
    setFriends((prev) => [...prev, friend]);
    return friend;
  }, []);

  const removeFriend = useCallback((id: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const renameFriend = useCallback((id: string, name: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: name.trim() } : f)),
    );
  }, []);

  const getFriend = useCallback(
    (id: string) => friends.find((f) => f.id === id),
    [friends],
  );

  const setStickerQuantity = useCallback(
    (friendId: string, stickerId: string, quantity: number) => {
      setFriends((prev) =>
        prev.map((f) => {
          if (f.id !== friendId) return f;
          if (quantity <= 0) {
            return {
              ...f,
              stickers: f.stickers.filter((d) => d.stickerId !== stickerId),
            };
          }
          const idx = f.stickers.findIndex((d) => d.stickerId === stickerId);
          if (idx >= 0) {
            const next = [...f.stickers];
            next[idx] = { stickerId, quantity };
            return { ...f, stickers: next };
          }
          return {
            ...f,
            stickers: [...f.stickers, { stickerId, quantity }],
          };
        }),
      );
    },
    [],
  );

  const incrementSticker = useCallback(
    (friendId: string, stickerId: string) => {
      setFriends((prev) =>
        prev.map((f) => {
          if (f.id !== friendId) return f;
          const idx = f.stickers.findIndex((d) => d.stickerId === stickerId);
          if (idx >= 0) {
            const next = [...f.stickers];
            next[idx] = {
              stickerId,
              quantity: Math.min(99, next[idx].quantity + 1),
            };
            return { ...f, stickers: next };
          }
          return {
            ...f,
            stickers: [...f.stickers, { stickerId, quantity: 1 }],
          };
        }),
      );
    },
    [],
  );

  const importFriend = useCallback(
    (name: string, stickers: FriendSticker[]): Friend => {
      const friend: Friend = {
        id: crypto.randomUUID(),
        name: name.trim(),
        stickers,
        importedAt: Date.now(),
      };
      setFriends((prev) => [...prev, friend]);
      return friend;
    },
    [],
  );

  const replaceFriendStickers = useCallback(
    (friendId: string, name: string, stickers: FriendSticker[]) => {
      setFriends((prev) =>
        prev.map((f) =>
          f.id === friendId
            ? {
                ...f,
                name: name.trim() || f.name,
                stickers,
                importedAt: Date.now(),
              }
            : f,
        ),
      );
    },
    [],
  );

  return {
    friends,
    loaded,
    addFriend,
    removeFriend,
    renameFriend,
    getFriend,
    setStickerQuantity,
    incrementSticker,
    importFriend,
    replaceFriendStickers,
  };
}

export type UseFriendsReturn = ReturnType<typeof useFriends>;
