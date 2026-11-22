"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function buildRedirectTo(pathname: string) {
  if (typeof window === "undefined") {
    return "/auth/callback";
  }

  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", pathname || "/");
  return callbackUrl.toString();
}

export function SignInButton() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <Button
      type="button"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: buildRedirectTo(pathname),
          },
        });
      }}
    >
      {t("Continue with Google")}
    </Button>
  );
}
