/**
 * Dynamic Raw Time Data, Timezone Registry, & Clock Engine
 * Consolidated under src/data/
 */

export interface TimezoneOption {
  id: string;
  label: string;
  shortLabel: string;
  city: string;
  code: string;
  flag: string;
  offset: string;
  region: 'Asia/Pacific' | 'Americas' | 'Europe' | 'UTC';
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  {
    id: 'Asia/Singapore',
    label: 'Singapore (SGT)',
    shortLabel: 'SGP (SGT)',
    city: 'Singapore',
    code: 'SGT',
    flag: '🇸🇬',
    offset: 'UTC+8',
    region: 'Asia/Pacific',
  },
  {
    id: 'America/New_York',
    label: 'New York (EST/EDT)',
    shortLabel: 'NYC (EDT)',
    city: 'New York',
    code: 'EDT',
    flag: '🇺🇸',
    offset: 'UTC-4',
    region: 'Americas',
  },
  {
    id: 'Europe/London',
    label: 'London (GMT/BST)',
    shortLabel: 'LON (BST)',
    city: 'London',
    code: 'BST',
    flag: '🇬🇧',
    offset: 'UTC+1',
    region: 'Europe',
  },
  {
    id: 'Asia/Tokyo',
    label: 'Tokyo (JST)',
    shortLabel: 'TYO (JST)',
    city: 'Tokyo',
    code: 'JST',
    flag: '🇯🇵',
    offset: 'UTC+9',
    region: 'Asia/Pacific',
  },
  {
    id: 'Asia/Hong_Kong',
    label: 'Hong Kong (HKT)',
    shortLabel: 'HKG (HKT)',
    city: 'Hong Kong',
    code: 'HKT',
    flag: '🇭🇰',
    offset: 'UTC+8',
    region: 'Asia/Pacific',
  },
  {
    id: 'Europe/Berlin',
    label: 'Frankfurt / Berlin (CET/CEST)',
    shortLabel: 'FRA (CET)',
    city: 'Frankfurt',
    code: 'CEST',
    flag: '🇩🇪',
    offset: 'UTC+2',
    region: 'Europe',
  },
  {
    id: 'Australia/Sydney',
    label: 'Sydney (AEST/AEDT)',
    shortLabel: 'SYD (AEST)',
    city: 'Sydney',
    code: 'AEST',
    flag: '🇦🇺',
    offset: 'UTC+10',
    region: 'Asia/Pacific',
  },
  {
    id: 'America/Los_Angeles',
    label: 'Los Angeles (PST/PDT)',
    shortLabel: 'LAX (PDT)',
    city: 'Los Angeles',
    code: 'PDT',
    flag: '🇺🇸',
    offset: 'UTC-7',
    region: 'Americas',
  },
  {
    id: 'America/Chicago',
    label: 'Chicago (CST/CDT)',
    shortLabel: 'CHI (CDT)',
    city: 'Chicago',
    code: 'CDT',
    flag: '🇺🇸',
    offset: 'UTC-5',
    region: 'Americas',
  },
  {
    id: 'UTC',
    label: 'Coordinated Universal Time (UTC)',
    shortLabel: 'UTC (GMT)',
    city: 'UTC',
    code: 'UTC',
    flag: '🌐',
    offset: 'UTC+0',
    region: 'UTC',
  },
];

export const DEFAULT_TIMEZONE = 'Asia/Singapore';

/**
 * Time Formatter in designated timezone
 */
export function formatTimeInTz(
  dateInput?: Date | string | number,
  timezone: string = DEFAULT_TIMEZONE,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '--:--:--';

  const defaultOpts: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezone,
  };

  return new Intl.DateTimeFormat('en-US', { ...defaultOpts, ...options }).format(d);
}

/**
 * Date Formatter in designated timezone
 */
export function formatDateInTz(
  dateInput?: Date | string | number,
  timezone: string = DEFAULT_TIMEZONE,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '----/--/--';

  const defaultOpts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: timezone,
  };

  return new Intl.DateTimeFormat('en-US', { ...defaultOpts, ...options }).format(d);
}

/**
 * Combined Date & Time Formatter with Zone Code
 */
export function formatDateTimeInTz(
  dateInput?: Date | string | number,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '--';

  const tzOpt = TIMEZONE_OPTIONS.find((t) => t.id === timezone) || TIMEZONE_OPTIONS[0];
  const dateStr = formatDateInTz(d, timezone);
  const timeStr = formatTimeInTz(d, timezone);
  return `${dateStr} ${timeStr} ${tzOpt.code}`;
}

/**
 * Relative Elapsed Time Formatter
 */
export function formatRelativeTime(
  dateInput: Date | string | number,
  now: Date = new Date()
): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'recently';

  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 15) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  return `${diffDays}d ago`;
}

/**
 * Rolling Real-Time Hourly Buckets Generator
 */
export function generateRollingHours(
  count: number = 7,
  timezone: string = DEFAULT_TIMEZONE,
  now: Date = new Date()
): string[] {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: false,
    timeZone: timezone,
  });

  const nowHourStr = formatter.format(now);
  const nowHour = parseInt(nowHourStr, 10) || now.getHours();

  const hours: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const h = (nowHour - i + 24) % 24;
    hours.push(`${h < 10 ? '0' + h : h}:00`);
  }
  return hours;
}
