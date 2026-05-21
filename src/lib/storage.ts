import { promises as fs } from "node:fs";
import path from "node:path";
import type { CollectionEntry, Friend } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  const file = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(file, "utf-8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, filename);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, file);
}

export const readCollection = () =>
  readJsonFile<CollectionEntry[]>("collection.json", []);
export const writeCollection = (data: CollectionEntry[]) =>
  writeJsonFile("collection.json", data);

export const readFriends = () => readJsonFile<Friend[]>("friends.json", []);
export const writeFriends = (data: Friend[]) =>
  writeJsonFile("friends.json", data);
