import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLocale, LOCALE_COOKIE, LOCALE_MAX_AGE } from "@/lib/i18n/locale";

export async function PUT(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || !("locale" in payload) || !isLocale(payload.locale)) {
    return NextResponse.json({ error: "Invalid language." }, { status: 400 });
  }
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser();
      // A missing session is a guest; other auth failures must not silently skip an account save.
      if (error && error.name !== "AuthSessionMissingError") throw error;
      if (user) {
        // Display preference only. Editable metadata never participates in authorization.
        const { error: saveError } = await supabase.auth.updateUser({ data: { locale: payload.locale } });
        if (saveError) throw saveError;
      }
    }
    const response = NextResponse.json({ locale: payload.locale });
    response.cookies.set(LOCALE_COOKIE, payload.locale, {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: LOCALE_MAX_AGE,
      secure: new URL(request.url).protocol === "https:",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Could not save language preference." }, { status: 500 });
  }
}
