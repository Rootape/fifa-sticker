"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CollectionEntry } from "@/types";

const ENDPOINT = "/api/collection";

export function useCollection() {
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(ENDPOINT)
      .then((r) => r.json())
      .then((data: CollectionEntry[]) => {
        if (!cancelled) {
          setEntries(Array.isArray(data) ? data : []);
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
        body: JSON.stringify(entries),
      }).catch(() => {});
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
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

  return { entries, loaded, getEntry, setEntry, toggleOwned, increment };
}

export type UseCollectionReturn = ReturnType<typeof useCollection>;
