import { getUserTimezone } from "@/lib/auth";
import type { CalendarEvent } from "@/lib/calendar";
import {
  deleteUserEvent,
  getGoogleAuth,
  listUserEvents,
  upsertUserEvent,
  upsertUserRecord,
} from "@/lib/store";

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
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  id: string;
  location?: string;
  organizer?: {
    email: string;
    displayName?: string;
  };
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  status?: string;
  summary: string;
  updated?: string;
}

interface GoogleEventsResponse {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

interface GoogleWatchChannelResponse {
  expiration?: number | string;
  id: string;
  resourceId: string;
  resourceUri?: string;
  token?: string;
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

const GOOGLE_WATCH_RENEWAL_BUFFER_MS = 12 * 60 * 60 * 1000;
const GOOGLE_WATCH_REQUEST_TTL_MS = 6 * 24 * 60 * 60 * 1000;

type StoredGoogleAuth = Awaited<ReturnType<typeof getGoogleAuth>>;

async function saveGoogleAuthTokens(params: {
  accessToken?: string;
  expiresAt?: number | null;
  refreshToken?: string;
  userId: string;
}) {
  await upsertUserRecord({
    userId: params.userId,
    provider: "google",
    accessToken: params.accessToken,
    refreshToken: params.refreshToken,
    expiresAt: params.expiresAt ?? undefined,
  });
}

/**
 * Helper function to refresh the access token if needed
 */
async function refreshAccessTokenIfNeeded(
  userId: string,
  refreshToken: string,
  expiresAt?: number | null,
  forceRefresh: boolean = false
): Promise<string> {
  const hasValidExpiry =
    typeof expiresAt === "number" && Number.isFinite(expiresAt) && expiresAt > 0;
  const isExpired =
    forceRefresh ||
    !hasValidExpiry ||
    Date.now() >= ((expiresAt as number) - 300) * 1000;

  if (!isExpired) {
    const userData = await getGoogleAuth(userId);
    if (userData?.accessToken) {
      return userData.accessToken;
    }
  }

  if (!refreshToken) {
    throw new Error("Google refresh token missing. Please sign in with Google again.");
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
    const errorText = await response.text();
    throw new Error(
      `Failed to refresh access token: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
    );
  }

  const data = await response.json();

  await saveGoogleAuthTokens({
    userId,
    accessToken: data.access_token,
    refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
  });

  return data.access_token;
}

async function getValidGoogleAccessToken(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt?: number | null,
  forceRefresh: boolean = false
) {
  await saveGoogleAuthTokens({
    userId,
    accessToken,
    refreshToken,
    expiresAt,
  });

  return refreshAccessTokenIfNeeded(
    userId,
    refreshToken,
    expiresAt,
    forceRefresh
  );
}

async function fetchGoogleCalendarResponse(params: {
  accessToken: string;
  acceptedStatusCodes?: number[];
  context: string;
  expiresAt?: number | null;
  init?: RequestInit;
  refreshToken: string;
  url: string;
  userId: string;
}) {
  const {
    accessToken,
    acceptedStatusCodes,
    context,
    expiresAt,
    init,
    refreshToken,
    url,
    userId,
  } = params;

  const doFetch = async (bearerToken: string) => {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${bearerToken}`);

    return fetch(url, {
      ...init,
      headers,
    });
  };

  let token = await getValidGoogleAccessToken(
    userId,
    accessToken,
    refreshToken,
    expiresAt
  );
  let response = await doFetch(token);

  if (response.status === 401) {
    token = await getValidGoogleAccessToken(
      userId,
      accessToken,
      refreshToken,
      expiresAt,
      true
    );
    response = await doFetch(token);
  }

  if (!response.ok && !acceptedStatusCodes?.includes(response.status)) {
    const errorText = await response.text();
    throw new Error(
      `${context}: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
    );
  }

  return response;
}

async function fetchGoogleCalendarJson<T>(params: {
  accessToken: string;
  context: string;
  expiresAt?: number | null;
  input: string;
  init?: RequestInit;
  refreshToken: string;
  userId: string;
}): Promise<T> {
  const response = await fetchGoogleCalendarResponse({
    accessToken: params.accessToken,
    context: params.context,
    expiresAt: params.expiresAt,
    init: params.init,
    refreshToken: params.refreshToken,
    url: params.input,
    userId: params.userId,
  });

  return (await response.json()) as T;
}

/**
 * Convert Google Calendar event to our CalendarEvent format
 */
function convertGoogleEventToCalendarEvent(
  googleEvent: GoogleCalendarEvent,
  userId: string
): CalendarEvent {
  const isAllDay = !!(googleEvent.start.date && googleEvent.end.date);
  const start = isAllDay
    ? new Date(`${googleEvent.start.date}T00:00:00.000Z`).toISOString()
    : googleEvent.start.dateTime;
  const end = isAllDay
    ? new Date(`${googleEvent.end.date}T00:00:00.000Z`).toISOString()
    : googleEvent.end.dateTime;

  return {
    id: `google_${googleEvent.id}`,
    title: googleEvent.summary,
    description: googleEvent.description,
    start,
    end,
    location: googleEvent.location,
    color: googleEvent.colorId
      ? colorMap[googleEvent.colorId] || "#3b82f6"
      : "#3b82f6",
    userId,
    source: "google",
    sourceId: googleEvent.id,
    allDay: isAllDay,
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
    start: event.allDay
      ? {
          date: event.start.slice(0, 10),
          timeZone: userTimezone,
        }
      : {
          dateTime: event.start,
          timeZone: userTimezone,
        },
    end: event.allDay
      ? {
          date: event.end.slice(0, 10),
          timeZone: userTimezone,
        }
      : {
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
    const userTimezone = await getUserTimezone(userId);

    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();

    const data = await fetchGoogleCalendarJson<GoogleEventsResponse>({
      userId,
      accessToken: _accessToken,
      refreshToken,
      expiresAt,
      input: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(
        calendarId
      )}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&showDeleted=true&timeZone=${encodeURIComponent(userTimezone)}`,
      context: "Failed to fetch Google Calendar events",
    });

    const events = (data.items ?? []).map((item: GoogleCalendarEvent) =>
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
    const googleEvent = convertCalendarEventToGoogleEvent(event);

    const data = await fetchGoogleCalendarJson<GoogleCalendarEvent>({
      userId,
      accessToken: _accessToken,
      refreshToken,
      expiresAt,
      input: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      },
      context: "Failed to create Google Calendar event",
    });

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

    const googleEvent = convertCalendarEventToGoogleEvent(event);

    const data = await fetchGoogleCalendarJson<GoogleCalendarEvent>({
      userId,
      accessToken: _accessToken,
      refreshToken,
      expiresAt,
      input: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
      init: {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      },
      context: "Failed to update Google Calendar event",
    });

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

    const response = await fetchGoogleCalendarResponse({
      userId,
      accessToken: _accessToken,
      refreshToken,
      expiresAt,
      url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
      init: {
        method: "DELETE",
      },
      context: "Failed to delete Google Calendar event",
    });

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
    const data = await fetchGoogleCalendarJson<{
      items?: Array<{
        backgroundColor?: string;
        id: string;
        primary: boolean;
        summary: string;
      }>;
    }>({
      userId,
      accessToken: _accessToken,
      refreshToken,
      expiresAt,
      input: `${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`,
      context: "Failed to fetch Google Calendars",
    });

    return (data.items ?? []).map((item) => ({
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

async function stopGoogleCalendarWatch(
  userId: string,
  auth: StoredGoogleAuth,
  calendarId: string
) {
  if (
    !auth?.accessToken ||
    !auth.refreshToken ||
    !auth.expiresAt ||
    !auth.googleWatchChannelId ||
    !auth.googleWatchResourceId
  ) {
    return;
  }

  try {
    await fetchGoogleCalendarResponse({
      userId,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      expiresAt: auth.expiresAt,
      url: `${GOOGLE_CALENDAR_API_BASE}/channels/stop`,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: auth.googleWatchChannelId,
          resourceId: auth.googleWatchResourceId,
        }),
      },
      context: "Failed to stop Google Calendar watch",
    });
  } catch (error) {
    console.error("Error stopping Google Calendar watch:", error);
  } finally {
    await upsertUserRecord({
      userId,
      googleWatchCalendarId: calendarId,
      googleWatchChannelId: "",
      googleWatchExpiration: 0,
      googleWatchResourceId: "",
      googleWatchToken: "",
    });
  }
}

export async function ensureGoogleCalendarWatch(params: {
  accessToken: string;
  calendarId?: string;
  expiresAt: number;
  refreshToken: string;
  userId: string;
  webhookBaseUrl?: string;
}) {
  const {
    accessToken,
    calendarId = DEFAULT_CALENDAR_ID,
    expiresAt,
    refreshToken,
    userId,
    webhookBaseUrl,
  } = params;

  if (!webhookBaseUrl?.startsWith("https://")) {
    return { active: false, reason: "missing-public-https-url" as const };
  }

  const existing = await getGoogleAuth(userId);
  const now = Date.now();
  const needsRenewal =
    !existing?.googleWatchChannelId ||
    !existing.googleWatchExpiration ||
    existing.googleWatchExpiration <= now + GOOGLE_WATCH_RENEWAL_BUFFER_MS ||
    existing.googleWatchCalendarId !== calendarId;

  if (!needsRenewal) {
    return {
      active: true,
      channelId: existing.googleWatchChannelId,
      expiration: existing.googleWatchExpiration,
    };
  }

  if (existing?.googleWatchChannelId && existing.googleWatchResourceId) {
    await stopGoogleCalendarWatch(userId, existing, calendarId);
  }

  const channelToken = crypto.randomUUID();
  const requestedExpiration = now + GOOGLE_WATCH_REQUEST_TTL_MS;
  const watchResponse = await fetchGoogleCalendarJson<GoogleWatchChannelResponse>({
    userId,
    accessToken,
    refreshToken,
    expiresAt,
    input: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        type: "web_hook",
        address: `${webhookBaseUrl}/api/calendar/google/webhook`,
        token: channelToken,
        expiration: requestedExpiration,
      }),
    },
    context: "Failed to register Google Calendar watch",
  });

  const actualExpiration =
    typeof watchResponse.expiration === "string"
      ? Number(watchResponse.expiration)
      : watchResponse.expiration;

  await upsertUserRecord({
    userId,
    provider: "google",
    accessToken,
    refreshToken,
    expiresAt,
    googleWatchCalendarId: calendarId,
    googleWatchChannelId: watchResponse.id,
    googleWatchExpiration: actualExpiration || requestedExpiration,
    googleWatchResourceId: watchResponse.resourceId,
    googleWatchToken: channelToken,
  });

  return {
    active: true,
    channelId: watchResponse.id,
    expiration: actualExpiration || requestedExpiration,
  };
}

export async function syncGoogleCalendarEventsIncrementally(params: {
  accessToken: string;
  calendarId?: string;
  expiresAt: number;
  refreshToken: string;
  userId: string;
}) {
  const {
    accessToken,
    calendarId = DEFAULT_CALENDAR_ID,
    expiresAt,
    refreshToken,
    userId,
  } = params;

  const storedAuth = await getGoogleAuth(userId);
  const currentSyncToken = storedAuth?.googleSyncToken;
  const userTimezone = await getUserTimezone(userId);

  const syncOnce = async (syncToken?: string, isRecoveryFullSync = false) => {
    const syncedEvents: CalendarEvent[] = [];
    const syncedIds = new Set<string>();
    let deleted = 0;
    let nextPageToken: string | undefined;
    let nextSyncToken: string | undefined;

    do {
      const params = new URLSearchParams({
        singleEvents: "true",
        showDeleted: "true",
        timeZone: userTimezone,
      });

      if (syncToken) {
        params.set("syncToken", syncToken);
      }

      if (nextPageToken) {
        params.set("pageToken", nextPageToken);
      }

      const response = await fetchGoogleCalendarResponse({
        userId,
        accessToken,
        acceptedStatusCodes: syncToken ? [410] : undefined,
        refreshToken,
        expiresAt,
        url: `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
        context: "Failed to sync Google Calendar events",
      });

      if (!response.ok) {
        if (response.status === 410 && syncToken) {
          await upsertUserRecord({
            userId,
            googleSyncToken: "",
          });

          const localGoogleEvents = (await listUserEvents(userId)).filter(
            (event) => event.source === "google"
          );

          await Promise.all(
            localGoogleEvents.map((event) => deleteUserEvent(userId, event.id))
          );

          return syncOnce(undefined, true);
        }

        throw new Error(
          `Failed to sync Google Calendar events: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as GoogleEventsResponse;

      for (const item of data.items ?? []) {
        const localEventId = `google_${item.id}`;

        if (item.status === "cancelled") {
          await deleteUserEvent(userId, localEventId);
          deleted++;
          continue;
        }

        const event = convertGoogleEventToCalendarEvent(item, userId);
        await upsertUserEvent(event);
        syncedEvents.push(event);
        syncedIds.add(event.id);
      }

      nextPageToken = data.nextPageToken;
      nextSyncToken = data.nextSyncToken ?? nextSyncToken;
    } while (nextPageToken);

    if (!syncToken || isRecoveryFullSync) {
      const localGoogleEvents = (await listUserEvents(userId)).filter(
        (event) => event.source === "google"
      );

      await Promise.all(
        localGoogleEvents
          .filter((event) => !syncedIds.has(event.id))
          .map(async (event) => {
            deleted++;
            await deleteUserEvent(userId, event.id);
          })
      );
    }

    await upsertUserRecord({
      userId,
      provider: "google",
      accessToken,
      refreshToken,
      expiresAt,
      googleSyncToken: nextSyncToken,
      googleWatchCalendarId: calendarId,
      lastGoogleSync: Date.now(),
    });

    return {
      deleted,
      events: syncedEvents,
      fullSync: !syncToken || isRecoveryFullSync,
      nextSyncToken,
    };
  };

  return syncOnce(currentSyncToken);
}
