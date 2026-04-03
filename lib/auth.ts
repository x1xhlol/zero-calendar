import {
  getUserPreferences as getStoredUserPreferences,
  getUserTimezone as getStoredUserTimezone,
  saveUserPreferences as saveStoredUserPreferences,
} from "@/lib/store";

export async function saveUserPreferences(
  userId: string,
  preferences: Record<string, unknown>
) {
  if (!preferences.timezone) {
    try {
      preferences.timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (_error) {
      preferences.timezone = "UTC";
    }
  }

  await saveStoredUserPreferences(userId, preferences);
}

export async function getUserPreferences(userId: string) {
  return await getStoredUserPreferences(userId);
}

export async function getUserTimezone(userId: string): Promise<string> {
  try {
    return await getStoredUserTimezone(userId);
  } catch (error) {
    console.error("Error getting user timezone:", error);
    return "UTC";
  }
}
