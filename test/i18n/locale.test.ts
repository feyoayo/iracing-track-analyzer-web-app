import { describe, expect, it } from "vitest";
import { resolveLocale } from "@/lib/i18n/locale";
import { translate } from "@/lib/i18n/messages";

describe("locale selection", () => {
  it("defaults to English regardless of browser language", () => {
    expect(resolveLocale(undefined, undefined)).toBe("en");
    expect(resolveLocale("ua", "fr")).toBe("en");
  });
  it("prefers the account setting to a guest cookie", () => {
    expect(resolveLocale("en", "uk")).toBe("en");
    expect(resolveLocale("uk", "en")).toBe("uk");
    expect(resolveLocale(null, "uk")).toBe("uk");
  });
  it("translates complete messages and preserves named entities", () => {
    expect(translate("uk", "Tracks")).toBe("Траси");
    expect(translate("uk", "Page {page} of {total}", { page: 2, total: 4 })).toBe("Сторінка 2 з 4");
    expect(translate("uk", "Spa-Francorchamps")).toBe("Spa-Francorchamps");
    expect(translate("en", "Page {page} of {total}", { page: 2, total: 4 })).toBe("Page 2 of 4");
  });
});
