import Link from "next/link";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-6 md:px-6">
      <SiteHeader
        currentTab="season-planning"
        seasonName="Unavailable"
        title="Authentication error"
        description="Google sign-in could not be completed for this session."
      />

      <Card className="max-w-2xl">
        <CardContent className="grid gap-4 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Auth
            </p>
            <h2 className="mt-1 text-lg font-semibold">Sign-in did not complete</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Verify that Google is enabled in Supabase, the callback URL is configured,
            and the app has valid Supabase environment variables.
          </p>
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Return to season planning
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
