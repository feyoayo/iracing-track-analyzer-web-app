import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type FavoriteSeriesPayload = {
  seriesName?: unknown;
  favorite?: unknown;
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
    .from("user_favorite_series")
    .select("series_name")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Could not load favorite series right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    seriesNames: data.map((row) => row.series_name as string),
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

  const payload = (await request.json()) as FavoriteSeriesPayload;
  const seriesName =
    typeof payload.seriesName === "string" ? payload.seriesName.trim() : "";
  const favorite =
    typeof payload.favorite === "boolean" ? payload.favorite : null;

  if (!seriesName || favorite === null) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const mutation = favorite
    ? await supabase.from("user_favorite_series").upsert(
        { user_id: user.id, series_name: seriesName },
        { onConflict: "user_id,series_name", ignoreDuplicates: false },
      )
    : await supabase
        .from("user_favorite_series")
        .delete()
        .eq("user_id", user.id)
        .eq("series_name", seriesName);

  if (mutation.error) {
    return NextResponse.json(
      { error: "Could not update favorite series right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
