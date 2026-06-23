import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type OwnedTrackPayload = {
  trackId?: unknown;
  owned?: unknown;
};

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_owned_tracks")
    .select("track_id")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Could not load owned tracks right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    trackIds: data.map((row) => row.track_id as number),
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json()) as OwnedTrackPayload;
  const trackId =
    typeof payload.trackId === "number" && Number.isInteger(payload.trackId)
      ? payload.trackId
      : Number.NaN;
  const owned = typeof payload.owned === "boolean" ? payload.owned : null;

  if (!Number.isInteger(trackId) || trackId <= 0 || owned === null) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const mutation = owned
    ? await supabase.from("user_owned_tracks").upsert(
        { user_id: user.id, track_id: trackId },
        { onConflict: "user_id,track_id", ignoreDuplicates: false },
      )
    : await supabase
        .from("user_owned_tracks")
        .delete()
        .eq("user_id", user.id)
        .eq("track_id", trackId);

  if (mutation.error) {
    return NextResponse.json(
      { error: "Could not update track ownership right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
