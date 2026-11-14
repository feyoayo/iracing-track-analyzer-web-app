import { NextResponse } from "next/server";

import { saveFeedback } from "@/lib/db/feedback";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!getSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const message = "message" in payload && typeof payload.message === "string" ? payload.message.trim() : "";
  const name = "name" in payload && typeof payload.name === "string" ? payload.name.trim() || null : null;
  const pagePath = "pagePath" in payload && typeof payload.pagePath === "string" ? payload.pagePath.trim() : null;
  if (message.length < 5 || message.length > 1000) {
    return NextResponse.json({ error: "Feedback must be between 5 and 1000 characters." }, { status: 400 });
  }
  if (name && name.length > 120) {
    return NextResponse.json({ error: "Name must be 120 characters or fewer." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  try {
    await saveFeedback({ userId: user?.id ?? null, name, message, pagePath });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save feedback right now." }, { status: 500 });
  }
}
