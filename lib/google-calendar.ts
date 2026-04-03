import { getUserTimezone } from "@/lib/auth";
import type { CalendarEvent } from "@/lib/calendar";
import { getGoogleAuth, upsertUserEvent, upsertUserRecord } from "@/lib/store";

const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
const DEFAULT_CALENDAR_ID = "primary";

interface GoogleCalendarEvent {
  colorId?: string;
  created?: string;
  creator?: {
    email: string;
    displayName?: string;
  };
  description?: string;
  end: {
    dateTime: string;
    timeZone?: string;
  };
  id: string;
  location?: string;
  organizer?: {
    email: string;
    displayName?: string;
  };
  start: {
    dateTime: string;
    timeZone?: string;
  };
  status?: string;
  summary: string;
  updated?: string;
}

const colorMap: Record<string, string> = {
  "1": "#3b82f6",
  "2": "#10b981",
  "3": "#ef4444",
  "4": "#f59e0b",
  "5": "#8b5cf6",
  "6": "#ec4899",
  "7": "#6366f1",
  "8": "#14b8a6",
  "9": "#f97316",
  "10": "#84cc16",
  "11": "#06b6d4",
};

const reverseColorMap: Record<string, string> = Object.entries(colorMap).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Helper function to refresh the access token if needed
 */
async function refreshAccessTokenIfNeeded(
  userId: string,
  refreshToken: string,
  expiresAt: number
): Promise<string> {
  const isExpired = Date.now() >= (expiresAt - 300) * 1000;

  if (!isExpired) {
    const userData = await getGoogleAuth(userId);
    return userData?.accessToken as string;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await response.json();

  await upsertUserRecord({
    userId,
    accessToken: data.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
  });

  return data.access_token;
}

/**
 * Convert Google Calendar event to our CalendarEvent format
 */
function convertGoogleEventToCalendarEvent(
  googleEvent: GoogleCalendarEvent,
  userId: string
): CalendarEvent {
  return {
    id: `google_${googleEvent.id}`,
    title: googleEvent.summary,
    description: googleEvent.description,
    start: googleEvent.start.dateTime,
    end: googleEvent.end.dateTime,
    location: googleEvent.location,
    color: googleEvent.colorId
      ? colorMap[googleEvent.colorId] || "#3b82f6"
      : "#3b82f6",
    userId,
    source: "google",

    timezone: googleEvent.start.timeZone || "UTC",
  };
}

async function convertCalendarEventToGoogleEvent(
  event: CalendarEvent
): Promise<Partial<GoogleCalendarEvent>> {
  const googleEventId = event.id.startsWith("google_")
    ? event.id.substring(7)
    : undefined;

  const userTimezone = await getUserTimezone(event.userId);

  return {
    id: googleEventId,
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.start,
      timeZone: userTimezone,
    },
    end: {
      dateTime: event.end,
      timeZone: userTimezone,
    },
    location: event.location,
    colorId: event.color ? reverseColorMap[event.color] || "1" : "1",
  };
}

export async function getGoogleCalendarEvents(
  userId: string,
  _accessToken: string,
  refreshToken: string,
  expiresAt: number,
  startDate: Date,
  endDate: Date,
  calendarId: string = DEFAULT_CALENDAR_ID
): Promise<CalendarEvent[]> {
  try {
    const token = await refreshAccessTokenIfNeeded(
      userId,
      refreshToken,
      expiresAt
    );

    const userTimezone = await getUserTimezone(userId);

    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();

    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(
        calendarId
      )}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&timeZone=${encodeURIComponent(userTimezone)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Google Calendar events: ${response.statusText}`
      );
    }

    const data = await response.json();

    const events = data.items.map((item: GoogleCalendarEvent) =>
      convertGoogleEventToCalendarEvent(item, userId)
    );

    await storeGoogleEventsInDatabase(userId, events);

    return events;
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error);
    return [];
  }
}

async function storeGoogleEventsInDatabase(
  userId: string,
  events: CalendarEvent[]
): Promise<void> {
  try {
    for (const event of events) {
      await upsertUserEvent({
        ...event,
        userId,
        source: "google",
      });
    }
  } catch (error) {
    console.error("Error storing Google events in database:", error);
  }
}

/**
 * Create an event in Google Calendar
 */
export async function createGoogleCalendarEvent(
  userId: string,
  _accessToken: string,
  refreshToken: string,
  expiresAt: number,
  event: CalendarEvent,
  calendarId: string = DEFAULT_CALENDAR_ID
): Promise<CalendarEvent | null> {
  try {
    const token = await refreshAccessTokenIfNeeded(
      userId,
      refreshToken,
      expiresAt
    );

    const googleEvent = convertCalendarEventToGoogleEvent(event);

    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to create Google Calendar event: ${response.statusText}`
      );
    }

    const data = await response.json();

    return convertGoogleEventToCalendarEvent(data, userId);
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    return null;
  }
}

/**
 * Update an event in Google Calendar
 */
export async function updateGoogleCalendarEvent(
  userId: string,
  _accessToken: string,
  refreshToken: string,
  expiresAt: number,
  event: CalendarEvent,
  calendarId: string = DEFAULT_CALENDAR_ID
): Promise<CalendarEvent | null> {
  try {
    if (!event.id.startsWith("google_")) {
      throw new Error("Not a Google Calendar event");
    }

    const googleEventId = event.id.substring(7);

    const token = await refreshAccessTokenIfNeeded(
      userId,
      refreshToken,
      expiresAt
    );

    const googleEvent = convertCalendarEventToGoogleEvent(event);

    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to update Google Calendar event: ${response.statusText}`
      );
    }

    const data = await response.json();

    return convertGoogleEventToCalendarEvent(data, userId);
  } catch (error) {
    console.error("Error updating Google Calendar event:", error);
    return null;
  }
}

/**
 * Delete an event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  userId: string,
  _accessToken: string,
  refreshToken: string,
  expiresAt: number,
  eventId: string,
  calendarId: string = DEFAULT_CALENDAR_ID
): Promise<boolean> {
  try {
    if (!eventId.startsWith("google_")) {
      throw new Error("Not a Google Calendar event");
    }

    const googleEventId = eventId.substring(7);

    const token = await refreshAccessTokenIfNeeded(
      userId,
      refreshToken,
      expiresAt
    );

    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Error deleting Google Calendar event:", error);
    return false;
  }
}

/**
 * Get a list of the user's Google Calendars
 */
export async function getGoogleCalendars(
  userId: string,
  _accessToken: string,
  refreshToken: string,
  expiresAt: number
): Promise<
  { id: string; summary: string; primary: boolean; backgroundColor: string }[]
> {
  try {
    const token = await refreshAccessTokenIfNeeded(
      userId,
      refreshToken,
      expiresAt
    );

    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Google Calendars: ${response.statusText}`
      );
    }

    const data = await response.json();

    return data.items.map((item: any) => ({
      id: item.id,
      summary: item.summary,
      primary: item.primary,
      backgroundColor: item.backgroundColor || "#3b82f6",
    }));
  } catch (error) {
    console.error("Error fetching Google Calendars:", error);
    return [];
  }
}

/**
 * Check if a user has connected their Google Calendar
 */
export async function hasGoogleCalendarConnected(
  userId: string
): Promise<boolean> {
  try {
    const userData = await getGoogleAuth(userId);
    return !!(
      userData?.provider === "google" &&
      userData?.accessToken &&
      userData?.refreshToken
    );
  } catch (error) {
    console.error("Error checking Google Calendar connection:", error);
    return false;
  }
}
