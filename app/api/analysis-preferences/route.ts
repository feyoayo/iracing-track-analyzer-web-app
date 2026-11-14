import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Account settings are unavailable." }, { status: 503 });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const payload: unknown = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)
      || !("includePastWeeks" in payload) || typeof payload.includePastWeeks !== "boolean"
      || ("initializeOnly" in payload && typeof payload.initializeOnly !== "boolean")) {
      return NextResponse.json({ error: "Invalid preference." }, { status: 400 });
    }
    const existing = user.user_metadata?.include_past_weeks;
    if ("initializeOnly" in payload && payload.initializeOnly && typeof existing === "boolean") {
      return NextResponse.json({ includePastWeeks: existing });
    }
    // A display preference only; never use editable user metadata for authorization.
    const { error } = await supabase.auth.updateUser({ data: { include_past_weeks: payload.includePastWeeks } });
    if (error) throw error;
    return NextResponse.json({ includePastWeeks: payload.includePastWeeks });
  } catch {
    return NextResponse.json({ error: "Could not save account preference." }, { status: 500 });
  }
}
