import { NextResponse } from "next/server";

import { getFavoriteSeriesNames, setSeriesFavorite } from "@/lib/db/preferences";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    return NextResponse.json({ seriesNames: await getFavoriteSeriesNames(user.id) });
  } catch {
    return NextResponse.json({ error: "Could not load favorite series right now." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !("seriesName" in payload) || !("favorite" in payload) || typeof payload.seriesName !== "string" || !payload.seriesName.trim() || typeof payload.favorite !== "boolean") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  try {
    await setSeriesFavorite(user.id, payload.seriesName.trim(), payload.favorite);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update favorite series right now." }, { status: 500 });
  }
}
