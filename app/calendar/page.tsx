import { ModernCalendarView } from "@/components/modern-calendar-view";
import { getCurrentAuthUser } from "@/lib/auth-server";
import { getEvents, getUserCategories } from "@/lib/calendar";
import type { CalendarCategory, CalendarEvent } from "@/types/calendar";

export default async function CalendarPage() {
  const user = await getCurrentAuthUser();

  let events: CalendarEvent[] = [];
  let categories: CalendarCategory[] = [];

  if (user?.id) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    events = await getEvents(user.id, startOfMonth, endOfMonth);
    categories = await getUserCategories(user.id);
  }

  return (
    <div className="h-dvh overflow-hidden bg-background">
      <ModernCalendarView
        initialCategories={categories}
        initialEvents={events}
        userEmail={user?.email ?? undefined}
        userId={user?.id}
        userImage={user?.image ?? undefined}
        userName={user?.name ?? undefined}
        userProvider={user ? "google" : undefined}
      />
    </div>
  );
}
