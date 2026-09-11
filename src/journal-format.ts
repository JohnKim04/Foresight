type FormatOptions = { locale?: string; timeZone?: string };

export function formatLogListDate(timestamp: string, options: FormatOptions = {}): string {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString(options.locale, { month: "short", day: "numeric", timeZone: options.timeZone });
  const timePart = date.toLocaleTimeString(options.locale, { hour: "numeric", minute: "2-digit", timeZone: options.timeZone });
  return `${datePart} · ${timePart}`;
}

export function formatLogDateTime(timestamp: string, options: FormatOptions = {}): string {
  return new Date(timestamp).toLocaleString(options.locale, { dateStyle: "medium", timeStyle: "short", timeZone: options.timeZone });
}

export function formatLogAccessibilityDateTime(timestamp: string, options: FormatOptions = {}): string {
  return new Date(timestamp).toLocaleString(options.locale, { dateStyle: "full", timeStyle: "short", timeZone: options.timeZone });
}
