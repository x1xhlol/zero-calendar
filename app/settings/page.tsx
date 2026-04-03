import { redirect } from "next/navigation";
import { ModernSettingsForm } from "@/components/modern-settings-form";
import { getUserPreferences } from "@/lib/auth";
import { getCurrentAuthUser } from "@/lib/auth-server";

export default async function SettingsPage() {
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const preferences = await getUserPreferences(user.id);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-[1400px] px-6 py-6">
        <ModernSettingsForm
          initialPreferences={preferences}
          userEmail={user.email}
          userId={user.id}
          userImage={user.image ?? ""}
          userName={user.name}
          userProvider="google"
        />
      </main>
    </div>
  );
}
