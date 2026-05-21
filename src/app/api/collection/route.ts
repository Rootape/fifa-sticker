import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/storage";
import type { CollectionEntry } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await readCollection();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as CollectionEntry[];
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Expected an array" }, { status: 400 });
  }
  await writeCollection(body);
  return NextResponse.json({ ok: true });
}
