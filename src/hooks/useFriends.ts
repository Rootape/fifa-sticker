"use client";

import { useCallback, useEffect, useState } from "react";
import type { Friend, FriendSticker } from "@/types";

const STORAGE_KEY = "fifa:friends";

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Friend[];
        if (Array.isArray(data)) setFriends(data);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
    } catch {}
  }, [friends, loaded]);

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
    removeFriend,
    renameFriend,
    getFriend,
    importFriend,
    replaceFriendStickers,
  };
}

export type UseFriendsReturn = ReturnType<typeof useFriends>;
