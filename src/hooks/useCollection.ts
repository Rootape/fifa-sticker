"use client";

import { useCallback, useEffect, useState } from "react";
import type { CollectionEntry } from "@/types";

const STORAGE_KEY = "fifa:collection";

export function useCollection() {
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as CollectionEntry[];
        if (Array.isArray(data)) setEntries(data);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {}
  }, [entries, loaded]);

  const getEntry = useCallback(
    (stickerId: string) => entries.find((e) => e.stickerId === stickerId),
    [entries],
  );

  const setEntry = useCallback(
    (stickerId: string, owned: boolean, quantity: number) => {
      setEntries((prev) => {
        if (!owned || quantity <= 0) {
          return prev.filter((e) => e.stickerId !== stickerId);
        }
        const entry: CollectionEntry = { stickerId, owned: true, quantity };
        const idx = prev.findIndex((e) => e.stickerId === stickerId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = entry;
          return next;
        }
        return [...prev, entry];
      });
    },
    [],
  );

  const toggleOwned = useCallback((stickerId: string) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.stickerId === stickerId);
      if (existing?.owned) {
        return prev.filter((e) => e.stickerId !== stickerId);
      }
      return [...prev, { stickerId, owned: true, quantity: 1 }];
    });
  }, []);

  const increment = useCallback((stickerId: string) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.stickerId === stickerId);
      if (idx < 0) {
        return [...prev, { stickerId, owned: true, quantity: 1 }];
      }
      const next = [...prev];
      next[idx] = {
        stickerId,
        owned: true,
        quantity: Math.min(99, (prev[idx].quantity || 0) + 1),
      };
      return next;
    });
  }, []);

  const replaceEntries = useCallback((next: CollectionEntry[]) => {
    setEntries(next);
  }, []);

  return {
    entries,
    loaded,
    getEntry,
    setEntry,
    toggleOwned,
    increment,
    replaceEntries,
  };
}

export type UseCollectionReturn = ReturnType<typeof useCollection>;
