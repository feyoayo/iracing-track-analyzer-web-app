"use client";

import { usePathname, useRouter } from "next/navigation";

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
      Continue with Google
    </Button>
  );
}

export function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.refresh();
        router.push("/");
      }}
    >
      Sign out
    </Button>
  );
}
