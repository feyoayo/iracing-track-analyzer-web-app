export type Locale = "en" | "uk";
export const LOCALE_COOKIE = "iracing-locale";
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "uk";
}

export function resolveLocale(account: unknown, cookie: unknown): Locale {
  return isLocale(account) ? account : isLocale(cookie) ? cookie : "en";
}
