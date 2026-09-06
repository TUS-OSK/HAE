import { NextResponse } from "next/server";
import { createRoom } from "@/lib/room";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const hostName = typeof body?.name === "string" ? body.name.trim() : "";
  const maxRounds = Number(body?.maxRounds) || 5;

  if (!hostName) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const { room, playerId } = await createRoom(hostName, maxRounds);
  return NextResponse.json({ room, playerId });
}
