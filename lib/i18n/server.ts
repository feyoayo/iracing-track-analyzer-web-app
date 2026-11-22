import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/supabase/auth";
import { LOCALE_COOKIE, resolveLocale } from "./locale";

export const getRequestLocale = cache(async () => {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  return resolveLocale(user?.user_metadata?.locale, cookieStore.get(LOCALE_COOKIE)?.value);
});
