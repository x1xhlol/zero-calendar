import { api, getConvexClient } from "@/lib/convex";
import type { CalendarCategory, CalendarEvent } from "@/types/calendar";

interface UserRecord {
  accessToken?: string;
  email?: string;
  expiresAt?: number;
  image?: string;
  lastGoogleSync?: number;
  name?: string;
  preferences?: Record<string, unknown>;
  provider?: string;
  refreshToken?: string;
  userId: string;
}

export const defaultCategories: CalendarCategory[] = [
  {
    id: "personal",
    name: "Personal",
    color: "#3b82f6",
    userId: "",
    visible: true,
  },
  { id: "work", name: "Work", color: "#10b981", userId: "", visible: true },
  { id: "family", name: "Family", color: "#8b5cf6", userId: "", visible: true },
];

function stripUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
}

function withUserId(
  category: CalendarCategory,
  userId: string
): CalendarCategory {
  return {
    ...category,
    userId,
  };
}

export async function getUserRecord(
  userId: string
): Promise<UserRecord | null> {
  const client = getConvexClient();
  const user = await client.query(api.users.getByUserId, { userId });

  if (!user) {
    return null;
  }

  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    image: user.image,
    provider: user.provider,
    accessToken: user.accessToken,
    refreshToken: user.refreshToken,
    expiresAt: user.expiresAt,
    preferences:
      (user.preferences as Record<string, unknown> | undefined) ?? {},
    lastGoogleSync: user.lastGoogleSync,
  };
}

export async function upsertUserRecord(user: UserRecord) {
  const client = getConvexClient();
  await client.mutation(api.users.upsert, stripUndefined(user));
}

export async function getUserPreferences(userId: string) {
  return (await getUserRecord(userId))?.preferences ?? {};
}

export async function saveUserPreferences(
  userId: string,
  preferences: Record<string, unknown>
) {
  await upsertUserRecord({
    userId,
    preferences,
  });
}

export async function getUserTimezone(userId: string) {
  const preferences = await getUserPreferences(userId);
  return typeof preferences.timezone === "string"
    ? preferences.timezone
    : "UTC";
}

export async function listUserEvents(userId: string): Promise<CalendarEvent[]> {
  const client = getConvexClient();
  const events = await client.query(api.events.listByUser, { userId });

  return events
    .map((entry) => entry.data as CalendarEvent)
    .sort(
      (left, right) =>
        new Date(left.start).getTime() - new Date(right.start).getTime()
    );
}

export async function getUserEvent(
  userId: string,
  eventId: string
): Promise<CalendarEvent | null> {
  const client = getConvexClient();
  const event = await client.query(api.events.getByEventId, {
    userId,
    eventId,
  });
  return event ? (event.data as CalendarEvent) : null;
}

export async function upsertUserEvent(event: CalendarEvent) {
  const client = getConvexClient();
  await client.mutation(api.events.upsert, {
    userId: event.userId,
    eventId: event.id,
    startMs: new Date(event.start).getTime(),
    endMs: new Date(event.end).getTime(),
    source: event.source,
    data: event,
  });
}

export async function deleteUserEvent(userId: string, eventId: string) {
  const client = getConvexClient();
  await client.mutation(api.events.deleteByEventId, { userId, eventId });
}

export async function listUserCategories(
  userId: string
): Promise<CalendarCategory[]> {
  const client = getConvexClient();
  const categories = await client.query(api.categories.listByUser, { userId });

  if (categories.length === 0) {
    return defaultCategories.map((category) => withUserId(category, userId));
  }

  return categories
    .map((entry) => entry.data as CalendarCategory)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function upsertUserCategory(category: CalendarCategory) {
  const client = getConvexClient();
  await client.mutation(api.categories.upsert, {
    userId: category.userId,
    categoryId: category.id,
    data: category,
  });
}

export async function ensureDefaultCategories(userId: string) {
  const categories = await listUserCategories(userId);

  if (
    categories.length > 0 &&
    categories[0].userId === userId &&
    categories.some((item) => item.id === "personal")
  ) {
    return categories;
  }

  const seeded = defaultCategories.map((category) =>
    withUserId(category, userId)
  );
  await Promise.all(seeded.map((category) => upsertUserCategory(category)));
  return seeded;
}

export async function getGoogleAuth(userId: string) {
  const user = await getUserRecord(userId);

  if (!user) {
    return null;
  }

  return {
    provider: user.provider,
    accessToken: user.accessToken,
    refreshToken: user.refreshToken,
    expiresAt: user.expiresAt,
    lastGoogleSync: user.lastGoogleSync,
  };
}
