import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { loadStickers, writeStickers } from "@/lib/stickers";
import type { Sticker } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await loadStickers();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { stickers?: Sticker[] };
  if (!body || !Array.isArray(body.stickers)) {
    return NextResponse.json(
      { error: "Expected { stickers: Sticker[] }" },
      { status: 400 },
    );
  }
  const next = await writeStickers(body.stickers);
  revalidatePath("/", "layout");
  return NextResponse.json(next);
}
