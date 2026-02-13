
/**
 * Returns the current date in the specified timezone formatted as YYYY-MM-DD.
 * Uses the "en-CA" locale which naturally formats to YYYY-MM-DD.
 * 
 * @param timezone - The IANA timezone string (e.g., "America/New_York"). Defaults to "UTC".
 * @returns The formatted date string.
 */
export function getCurrentDateInTimezone(timezone: string = "UTC"): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch (error) {
    console.error(`Invalid timezone: ${timezone}. Falling back to UTC.`);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
}
