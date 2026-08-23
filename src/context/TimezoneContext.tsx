import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  TIMEZONE_OPTIONS,
  TimezoneOption,
  formatTimeInTz,
  formatDateInTz,
  formatDateTimeInTz,
  formatRelativeTime,
  generateRollingHours,
  DEFAULT_TIMEZONE,
} from '../data/timezones';

export type { TimezoneOption };
export { TIMEZONE_OPTIONS };

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
      return DEFAULT_TIMEZONE;
    } catch {
      return DEFAULT_TIMEZONE;
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

  const formatTime = (
    dateInput?: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    return formatTimeInTz(dateInput || currentTime, timezone, options);
  };

  const formatDate = (
    dateInput?: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    return formatDateInTz(dateInput || currentTime, timezone, options);
  };

  const formatDateTime = (dateInput?: Date | string | number): string => {
    return formatDateTimeInTz(dateInput || currentTime, timezone);
  };

  const formatRelative = (dateInput: Date | string | number): string => {
    return formatRelativeTime(dateInput, currentTime);
  };

  const getRollingHours = (count: number = 7): string[] => {
    return generateRollingHours(count, timezone, currentTime);
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

