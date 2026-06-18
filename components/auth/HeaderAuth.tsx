import { SignInButton } from "@/components/auth/AuthButton";
import { UserMenu } from "@/components/auth/UserMenu";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function HeaderAuth() {
  if (!hasSupabaseEnv()) {
    return 
  }

  const supabase = await createClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="flex flex-col items-start gap-3 lg:items-end">
      <SignInButton />
    </div>;
  }

  const avatarUrl = user.user_metadata.avatar_url as string | undefined;
  const displayName = user.user_metadata.full_name ?? "Signed in";

  return (
    <div className="flex flex-col items-start gap-3 lg:items-end">
      <UserMenu
        displayName={displayName}
        email={user.email}
        avatarUrl={avatarUrl}
      />
    </div>
  );
}
