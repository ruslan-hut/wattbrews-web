/**
 * Date / time formatting utilities.
 *
 * Product convention across the whole app is European 24-hour style:
 *
 *   - Dates:     dd.MM.yyyy          e.g. "06.12.2006"
 *   - Times:     HH:mm               e.g. "14:30" (no seconds, no AM/PM)
 *   - Combined:  dd.MM.yyyy HH:mm    e.g. "06.12.2006 14:30"
 *
 * Every UI surface that displays a date or time MUST go through one of
 * the helpers below rather than calling `toLocaleString` / `toLocaleDateString`
 * directly. This keeps the output deterministic regardless of the user's
 * browser locale (a Chromebook in en-US and an Android in es-ES will
 * render the exact same string).
 *
 * The implementation is Intl-free by design — locale-dependent APIs
 * would undo the whole point of enforcing a single format.
 */

const INVALID = 'Invalid Date';

function toDate(input: Date | string | null | undefined): Date | null {
  if (input === null || input === undefined) return null;
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return null;
  // Go's zero-value timestamps ("0001-01-01T00:00:00Z") often leak
  // through the API; treat them as "no value".
  if (d.getUTCFullYear() <= 1) return null;
  return d;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export class DateUtils {
  /**
   * Format a date as `dd.MM.yyyy`. Returns `INVALID` for
   * unparseable input and an empty string for null/undefined.
   */
  static formatDate(date: Date | string | null | undefined): string {
    const d = toDate(date);
    if (!d) return date === null || date === undefined ? '' : INVALID;
    return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
  }

  /**
   * Format the time portion of a Date as `HH:mm` (24-hour, no seconds).
   */
  static formatTime(date: Date | string | null | undefined): string {
    const d = toDate(date);
    if (!d) return date === null || date === undefined ? '' : INVALID;
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  /**
   * Format a full timestamp as `dd.MM.yyyy HH:mm`.
   */
  static formatDateTime(date: Date | string | null | undefined): string {
    const d = toDate(date);
    if (!d) return date === null || date === undefined ? '' : INVALID;
    return `${DateUtils.formatDate(d)} ${DateUtils.formatTime(d)}`;
  }

  /**
   * Normalize a plain time string — e.g. `"09:00:00"` or `"09:00"` —
   * down to `HH:mm`. Used for payment-plan start/end time values
   * the backend sends as strings, without date context.
   */
  static formatTimeString(timeString: string | null | undefined): string {
    if (!timeString) return '';
    if (!timeString.includes(':')) return timeString;
    const [h, m] = timeString.split(':');
    const hours = parseInt(h, 10);
    const minutes = parseInt(m, 10);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeString;
    return `${pad2(hours)}:${pad2(minutes)}`;
  }

  /**
   * Calculate the difference between two dates in minutes.
   */
  static getMinutesDifference(startDate: Date, endDate: Date): number {
    const diffInMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffInMs / (1000 * 60));
  }

  /**
   * Format duration in minutes to a readable string.
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Check if a date is today.
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Check if a date is yesterday.
   */
  static isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }

  /**
   * Relative time string. Today → `HH:mm`, yesterday → "Yesterday",
   * within 7 days → "N days ago", otherwise → `dd.MM.yyyy`.
   */
  static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (this.isToday(date)) {
      return this.formatTime(date);
    }

    if (this.isYesterday(date)) {
      return 'Yesterday';
    }

    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }

    return this.formatDate(date);
  }

  /**
   * Get time ago string (e.g., "2 minutes ago", "3 hours ago", "5 days ago").
   */
  static getTimeAgo(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return 'Unknown';
    }

    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }

    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }

    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }

    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }

    const years = Math.floor(diffInDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}
