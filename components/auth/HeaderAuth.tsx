import { SignInButton, SignOutButton } from "@/components/auth/AuthButton";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function HeaderAuth() {
  if (!hasSupabaseEnv()) {
    return (
      <p className="text-sm text-muted-foreground">
        Set Supabase env vars to enable sign-in.
      </p>
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SignInButton />;
  }

  return (
    <div className="flex flex-col items-start gap-3 lg:items-end">
      <div className="text-sm">
        <p className="font-medium">{user.user_metadata.full_name ?? "Signed in"}</p>
        <p className="text-muted-foreground">{user.email}</p>
      </div>
      <SignOutButton />
    </div>
  );
}
