import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { getLatestPreparedData } from "@/lib/data/preparedData";

export default async function ProfilePage() {
  const [{ season }, authSlot] = await Promise.all([
    getLatestPreparedData(),
    HeaderAuth(),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-6 md:px-6">
      <SiteHeader
        currentTab="season-planning"
        seasonName={season.seasonName}
        title="Profile"
        description="User profile page placeholder."
        authSlot={authSlot}
      />

      <Card className="max-w-3xl">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Profile page placeholder.</p>
        </CardContent>
      </Card>
    </main>
  );
}
