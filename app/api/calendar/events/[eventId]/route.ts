import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchAuthMutation, getCurrentAuthUser } from "@/lib/auth-server";
import { deleteEvent, getEvent, updateEvent } from "@/lib/calendar";
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from "@/lib/google-calendar";
import { upsertUserEvent, upsertUserRecord } from "@/lib/store";

interface RouteContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentAuthUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await context.params;
    const body = await request.json();

    if (body.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingEvent = await getEvent(user.id, eventId);

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = await updateEvent(user.id, eventId, {
      title: body.title,
      description: body.description,
      start: body.start,
      end: body.end,
      location: body.location,
      color: body.color,
      categoryId: body.category,
      categories: body.category ? [body.category] : undefined,
      allDay: body.allDay,
    });

    let finalEvent = event;

    if (body.pushToGoogle) {
      try {
        const tokens = await fetchAuthMutation(api.auth.refreshGoogleAccessToken, {});
        if (tokens?.accessToken && tokens?.refreshToken) {
          await upsertUserRecord({
            userId: user.id,
            provider: "google",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.accessTokenExpiresAt
              ? Math.floor(tokens.accessTokenExpiresAt / 1000)
              : 0,
          });

          if (existingEvent.source === "google") {
            const syncedEvent = await updateGoogleCalendarEvent(
              user.id,
              tokens.accessToken,
              tokens.refreshToken,
              tokens.accessTokenExpiresAt
                ? Math.floor(tokens.accessTokenExpiresAt / 1000)
                : 0,
              event
            );

            if (syncedEvent) {
              await upsertUserEvent(syncedEvent);
              finalEvent = syncedEvent;
            }
          } else {
            const syncedEvent = await createGoogleCalendarEvent(
              user.id,
              tokens.accessToken,
              tokens.refreshToken,
              tokens.accessTokenExpiresAt
                ? Math.floor(tokens.accessTokenExpiresAt / 1000)
                : 0,
              event
            );

            if (syncedEvent) {
              await deleteEvent(user.id, event.id);
              await upsertUserEvent(syncedEvent);
              finalEvent = syncedEvent;
            }
          }
        }
      } catch (error) {
        console.error("Failed to sync updated event to Google Calendar:", error);
      }
    }

    return NextResponse.json({ event: finalEvent });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentAuthUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const pushToGoogle = searchParams.get("pushToGoogle") === "true";

    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingEvent = await getEvent(user.id, eventId);

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (pushToGoogle && (existingEvent.source === "google" || existingEvent.sourceId)) {
      try {
        const tokens = await fetchAuthMutation(api.auth.refreshGoogleAccessToken, {});
        if (tokens?.accessToken && tokens?.refreshToken) {
          await upsertUserRecord({
            userId: user.id,
            provider: "google",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.accessTokenExpiresAt
              ? Math.floor(tokens.accessTokenExpiresAt / 1000)
              : 0,
          });

          await deleteGoogleCalendarEvent(
            user.id,
            tokens.accessToken,
            tokens.refreshToken,
            tokens.accessTokenExpiresAt
              ? Math.floor(tokens.accessTokenExpiresAt / 1000)
              : 0,
            existingEvent.source === "google"
              ? existingEvent.id
              : `google_${existingEvent.sourceId}`
          );
        }
      } catch (error) {
        console.error("Failed to delete event in Google Calendar:", error);
      }
    }

    await deleteEvent(user.id, eventId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
