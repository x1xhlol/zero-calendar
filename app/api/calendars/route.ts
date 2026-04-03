import { type NextRequest, NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/lib/auth-server";
import { getUserCategories } from "@/lib/calendar";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const calendars = await getUserCategories(userId);

    return NextResponse.json({ calendars });
  } catch (error) {
    console.error("Error fetching calendars:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
