import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

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

interface TimezoneContextType {
  timezone: string;
  setTimezone: (tz: string) => void;
  activeOption: TimezoneOption;
  currentTime: Date;
  tickCount: number;
  formatTime: (date?: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatDate: (date?: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (date?: Date | string | number) => string;
  formatRelative: (date: Date | string | number) => string;
  getRollingHours: (count?: number) => string[];
  getTimezoneAbbr: (tz?: string) => string;
  getTimezoneOffset: (tz?: string) => string;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export const TimezoneProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timezone, setTimezoneState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('quant_terminal_timezone');
      if (saved && TIMEZONE_OPTIONS.some((t) => t.id === saved)) {
        return saved;
      }
      // Default to Singapore as in standard APAC Quant hub, or user timezone
      return 'Asia/Singapore';
    } catch {
      return 'Asia/Singapore';
    }
  });

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [tickCount, setTickCount] = useState(0);

  // Real-time synchronization loop (1000ms clock tick)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setTickCount((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const setTimezone = (tz: string) => {
    setTimezoneState(tz);
    try {
      localStorage.setItem('quant_terminal_timezone', tz);
    } catch (e) {
      console.warn('Could not persist timezone to localStorage:', e);
    }
  };

  const activeOption = useMemo(() => {
    return TIMEZONE_OPTIONS.find((t) => t.id === timezone) || TIMEZONE_OPTIONS[0];
  }, [timezone]);

  // Format time in active timezone
  const formatTime = (
    dateInput?: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const d = dateInput ? new Date(dateInput) : currentTime;
    if (isNaN(d.getTime())) return '--:--:--';

    const defaultOpts: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: timezone,
    };

    return new Intl.DateTimeFormat('en-US', { ...defaultOpts, ...options }).format(d);
  };

  // Format date in active timezone
  const formatDate = (
    dateInput?: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const d = dateInput ? new Date(dateInput) : currentTime;
    if (isNaN(d.getTime())) return '----/--/--';

    const defaultOpts: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: timezone,
    };

    return new Intl.DateTimeFormat('en-US', { ...defaultOpts, ...options }).format(d);
  };

  // Format full date & time with timezone code
  const formatDateTime = (dateInput?: Date | string | number): string => {
    const d = dateInput ? new Date(dateInput) : currentTime;
    if (isNaN(d.getTime())) return '--';

    const dateStr = formatDate(d, { year: 'numeric', month: 'short', day: '2-digit' });
    const timeStr = formatTime(d, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${dateStr} ${timeStr} ${activeOption.code}`;
  };

  // Format relative elapsed time ("Just now", "2m ago", "1h ago")
  const formatRelative = (dateInput: Date | string | number): string => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'recently';

    const diffSec = Math.floor((currentTime.getTime() - d.getTime()) / 1000);
    if (diffSec < 15) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    return `${diffDays}d ago`;
  };

  // Get rolling real-time hours in active timezone for heatmap / charts
  const getRollingHours = (count: number = 7): string[] => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: timezone,
    });
    
    // Get current hour in the selected timezone
    const nowHourStr = formatter.format(currentTime);
    const nowHour = parseInt(nowHourStr, 10) || currentTime.getHours();

    const hours: string[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const h = (nowHour - i + 24) % 24;
      hours.push(`${h < 10 ? '0' + h : h}:00`);
    }
    return hours;
  };

  const getTimezoneAbbr = (tz?: string): string => {
    const opt = TIMEZONE_OPTIONS.find((t) => t.id === (tz || timezone));
    return opt ? opt.code : 'UTC';
  };

  const getTimezoneOffset = (tz?: string): string => {
    const opt = TIMEZONE_OPTIONS.find((t) => t.id === (tz || timezone));
    return opt ? opt.offset : 'UTC+0';
  };

  return (
    <TimezoneContext.Provider
      value={{
        timezone,
        setTimezone,
        activeOption,
        currentTime,
        tickCount,
        formatTime,
        formatDate,
        formatDateTime,
        formatRelative,
        getRollingHours,
        getTimezoneAbbr,
        getTimezoneOffset,
      }}
    >
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};
