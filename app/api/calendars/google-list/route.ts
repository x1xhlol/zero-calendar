import { type NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchAuthMutation, getCurrentAuthUser } from "@/lib/auth-server";
import { getGoogleCalendars } from "@/lib/google-calendar";

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = await fetchAuthMutation(api.auth.getGoogleAccessToken, {});

    if (!tokens?.accessToken) {
      return NextResponse.json({ connected: false, calendars: [] });
    }

    const calendars = await getGoogleCalendars(
      user.id,
      tokens.accessToken,
      "",
      tokens.accessTokenExpiresAt
        ? Math.floor(tokens.accessTokenExpiresAt / 1000)
        : 0
    );

    return NextResponse.json({ connected: true, calendars });
  } catch (error) {
    console.error("Error fetching Google calendars:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
