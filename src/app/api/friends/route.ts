import { NextResponse } from "next/server";
import { readFriends, writeFriends } from "@/lib/storage";
import type { Friend } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await readFriends();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Friend[];
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Expected an array" }, { status: 400 });
  }
  await writeFriends(body);
  return NextResponse.json({ ok: true });
}
