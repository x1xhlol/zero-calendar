import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchAuthMutation, getCurrentAuthUser } from "@/lib/auth-server";
import { syncWithGoogleCalendar } from "@/lib/calendar";
import { ensureGoogleCalendarWatch } from "@/lib/google-calendar";
import { upsertUserRecord } from "@/lib/store";

function getWebhookBaseUrl(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");

  if (host) {
    const protocol =
      forwardedProto ||
      (host.includes("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");

    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || process.env.CONVEX_SITE_URL;
}

export async function POST(request: NextRequest) {
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

    const expiresAt = tokens.accessTokenExpiresAt
      ? Math.floor(tokens.accessTokenExpiresAt / 1000)
      : 0;

    await upsertUserRecord({
      userId: user.id,
      provider: "google",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
    });

    const result = await syncWithGoogleCalendar(user.id, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
    });

    if (result.success) {
      try {
        await ensureGoogleCalendarWatch({
          userId: user.id,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt,
          webhookBaseUrl: getWebhookBaseUrl(request),
        });
      } catch (watchError) {
        console.error("Failed to register Google watch channel:", watchError);
      }
    }

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
        details: result.message,
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
