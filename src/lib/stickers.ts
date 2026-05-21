import { promises as fs } from "node:fs";
import path from "node:path";
import type { Sticker, StickersData } from "@/types";

const file = path.join(process.cwd(), "public", "data", "stickers.json");

export async function loadStickers(): Promise<StickersData> {
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw) as StickersData;
}

export function normalizeNumbering(stickers: Sticker[]): Sticker[] {
  const groups = new Map<string, Sticker[]>();
  const order: string[] = [];
  for (const s of stickers) {
    if (!groups.has(s.team)) {
      groups.set(s.team, []);
      order.push(s.team);
    }
    groups.get(s.team)!.push(s);
  }
  const result: Sticker[] = [];
  for (const team of order) {
    const group = groups.get(team)!;
    if (team === "FWC") {
      result.push(...group);
    } else {
      group.forEach((s, idx) => {
        result.push({
          ...s,
          number: idx,
          id: `${team}${idx}`,
          code: `${team}${idx}`,
        });
      });
    }
  }
  return result;
}

export async function writeStickers(stickers: Sticker[]): Promise<StickersData> {
  const current = await loadStickers();
  const normalized = normalizeNumbering(stickers);
  const next: StickersData = {
    ...current,
    meta: { ...current.meta, totalStickers: normalized.length },
    stickers: normalized,
  };
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(next, null, 2) + "\n", "utf-8");
  await fs.rename(tmp, file);
  return next;
}
