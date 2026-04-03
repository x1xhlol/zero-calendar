import { NextResponse } from "next/server";
import { saveUserPreferences } from "@/lib/auth";
import { getCurrentAuthUser } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentAuthUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, preferences } = await request.json();

    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await saveUserPreferences(userId, preferences);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
