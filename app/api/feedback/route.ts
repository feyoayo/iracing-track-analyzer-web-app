import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type FeedbackPayload = {
  message?: unknown;
  name?: unknown;
  pagePath?: unknown;
};

export async function POST(request: Request) {
  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 },
    );
  }

  const payload = (await request.json()) as FeedbackPayload;
  const message =
    typeof payload.message === "string" ? payload.message.trim() : "";
  const name =
    typeof payload.name === "string" ? payload.name.trim() : null;
  const pagePath =
    typeof payload.pagePath === "string" ? payload.pagePath.trim() : null;

  if (message.length < 5 || message.length > 1000) {
    return NextResponse.json(
      { error: "Feedback must be between 5 and 1000 characters." },
      { status: 400 },
    );
  }

  if (name && name.length > 120) {
    return NextResponse.json(
      { error: "Name must be 120 characters or fewer." },
      { status: 400 },
    );
  }

  const serverSupabase = await createClient();
  const {
    data: { user },
  } = serverSupabase
    ? await serverSupabase.auth.getUser()
    : { data: { user: null } };

  const supabase = createSupabaseClient(env.url, env.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    name,
    message,
    page_path: pagePath,
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not save feedback right now." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
