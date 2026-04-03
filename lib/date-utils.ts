/**
 * Safely converts a value to a Date object
 * @param value The value to convert to a Date
 * @returns A valid Date object or null if conversion fails
 */
export function safeDate(value: any): Date | null {
  if (!value) {
    return null;
  }

  try {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === "string") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === "number") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
  } catch (error) {
    console.error("Error converting to date:", error);
    return null;
  }
}

/**
 * Safely gets the timestamp from a date value
 * @param value The date value
 * @param defaultValue Optional default value to return if conversion fails
 * @returns The timestamp or the default value
 */
export function safeGetTime(value: any, defaultValue = 0): number {
  const date = safeDate(value);
  return date ? date.getTime() : defaultValue;
}

/**
 * Safely formats a date with error handling
 * @param value The date to format
 * @param formatFn The formatting function to use
 * @param defaultValue The default value to return if formatting fails
 * @returns The formatted date string or the default value
 */
export function safeFormatDate(
  value: any,
  formatFn: (date: Date) => string,
  defaultValue = "Invalid date"
): string {
  const date = safeDate(value);
  if (!date) {
    return defaultValue;
  }

  try {
    return formatFn(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return defaultValue;
  }
}
