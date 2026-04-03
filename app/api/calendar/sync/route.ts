import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchAuthMutation, getCurrentAuthUser } from "@/lib/auth-server";
import { syncWithGoogleCalendar } from "@/lib/calendar";

export async function POST() {
  try {
    const user = await getCurrentAuthUser();

    if (!user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tokens = await fetchAuthMutation(
      api.auth.refreshGoogleAccessToken,
      {}
    );

    if (!(tokens?.accessToken && tokens?.refreshToken)) {
      return NextResponse.json(
        { message: "Google Calendar not connected" },
        { status: 400 }
      );
    }

    const result = await syncWithGoogleCalendar(user.id, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.accessTokenExpiresAt
        ? Math.floor(tokens.accessTokenExpiresAt / 1000)
        : null,
    });

    if (result.success) {
      return NextResponse.json({
        message: result.message,
        status: "success",
      });
    }
    return NextResponse.json(
      {
        message: result.message,
        status: "error",
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Calendar sync error:", error);

    let errorMessage = "Something went wrong during synchronization";

    if (error.message) {
      if (error.message.includes("token")) {
        errorMessage =
          "Authentication error. Please sign out and sign in again.";
      } else if (error.message.includes("rate limit")) {
        errorMessage =
          "Google Calendar API rate limit exceeded. Please try again later.";
      } else if (error.message.includes("network")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }
    }

    return NextResponse.json(
      {
        message: errorMessage,
        status: "error",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
