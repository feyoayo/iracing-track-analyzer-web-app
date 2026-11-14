import { NextResponse } from "next/server";

import { getOwnedTrackIds, setTrackOwned } from "@/lib/db/preferences";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    return NextResponse.json({ trackIds: await getOwnedTrackIds(user.id) });
  } catch {
    return NextResponse.json({ error: "Could not load owned tracks right now." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !("trackId" in payload) || !("owned" in payload) || typeof payload.trackId !== "number" || !Number.isInteger(payload.trackId) || payload.trackId <= 0 || typeof payload.owned !== "boolean") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  try {
    await setTrackOwned(user.id, payload.trackId, payload.owned);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update track ownership right now." }, { status: 500 });
  }
}
