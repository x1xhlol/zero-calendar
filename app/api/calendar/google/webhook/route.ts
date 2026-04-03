import { NextResponse } from "next/server";
import { syncGoogleCalendarEventsIncrementally } from "@/lib/google-calendar";
import { getUserRecordByGoogleWatchChannelId } from "@/lib/store";

export async function POST(request: Request) {
  const channelId = request.headers.get("x-goog-channel-id");
  const channelToken = request.headers.get("x-goog-channel-token");
  const resourceState = request.headers.get("x-goog-resource-state");

  if (!channelId) {
    return new NextResponse(null, { status: 200 });
  }

  try {
    const user = await getUserRecordByGoogleWatchChannelId(channelId);

    if (!user) {
      return new NextResponse(null, { status: 200 });
    }

    if (user.googleWatchToken && user.googleWatchToken !== channelToken) {
      return new NextResponse(null, { status: 200 });
    }

    if (
      resourceState === "sync" ||
      !user.accessToken ||
      !user.refreshToken ||
      !user.expiresAt
    ) {
      return new NextResponse(null, { status: 200 });
    }

    await syncGoogleCalendarEventsIncrementally({
      userId: user.userId,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      expiresAt: user.expiresAt,
      calendarId: user.googleWatchCalendarId,
    });
  } catch (error) {
    console.error("Google Calendar webhook handling failed:", error);
  }

  return new NextResponse(null, { status: 200 });
}
