import { type NextRequest, NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/lib/auth-server";
import { toggleCalendarVisibility } from "@/lib/calendar";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, calendarId } = body;

    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await toggleCalendarVisibility(userId, calendarId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error toggling calendar visibility:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
