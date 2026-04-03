import { redirect } from "next/navigation";
import { ModernSettingsForm } from "@/components/modern-settings-form";
import { getUserPreferences } from "@/lib/auth";
import { getCurrentAuthUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/auth/signin?callbackUrl=/settings");
  }

  const preferences = await getUserPreferences(user.id);

  return (
    <div className="h-screen overflow-hidden bg-background">
      <ModernSettingsForm
        initialPreferences={preferences}
        userEmail={user.email}
        userId={user.id}
        userImage={user.image ?? ""}
        userName={user.name}
        userProvider="google"
      />
    </div>
  );
}
