"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import type { Provider } from "@supabase/supabase-js";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.92A6 6 0 0 1 6.09 12c0-.67.11-1.32.31-1.92V7.49H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.51l3.35-2.59Z" />
      <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.49l3.35 2.59A6 6 0 0 1 12 5.96Z" />
    </svg>
  );
}

// Add enabled OAuth providers here; password sign-in can sit beside this list
// inside the dialog without changing the header entry point.
const providers: { provider: Provider; label: string; icon: typeof GoogleIcon }[] = [
  { provider: "google", label: "Continue with Google", icon: GoogleIcon },
];

export function SignInMethods() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState(false);
  const inFlight = useRef(false);

  async function signIn(provider: Provider) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(provider);
    setError(false);
    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", pathname || "/");
      const { error } = await createClient().auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl.toString() },
      });
      if (error) throw error;
      // Keep the buttons disabled while the browser redirects to the provider.
    } catch {
      inFlight.current = false;
      setPending(null);
      setError(true);
    }
  }

  return (
    <div className="grid gap-3" aria-busy={pending !== null}>
      {providers.map(({ provider, label, icon: Icon }) => (
        <Button key={provider} type="button" variant="outline" className="h-12 w-full gap-3 rounded-xl" disabled={pending !== null} onClick={() => void signIn(provider)}>
          {pending === provider ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Icon />}
          {t(pending === provider ? "Connecting…" : label)}
        </Button>
      ))}
      {error ? <p role="alert" className="text-center text-sm text-destructive">{t("Could not sign in. Please try again.")}</p> : null}
    </div>
  );
}
