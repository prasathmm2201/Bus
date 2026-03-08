import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function setISTHours(date: Date | string | number, hours: number, minutes: number, seconds: number = 0, ms: number = 0) {
  const d = new Date(date);
  // IST is UTC +5:30. 
  // To set target IST time, we set UTC time to (target - 5:30)
  d.setUTCHours(hours - 5, minutes - 30, seconds, ms);
  return d;
}

/**
 * Get the current time in IST (UTC+5:30)
 */
export function getCurrentISTDate() {
  const now = new Date();
  // Simply add 5.5 hours to UTC to get IST
  return new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
}

/**
 * Get UTC bounds for a given date in IST
 * @param date YYYY-MM-DD or Date object
 */
export function getISTDayBounds(date: Date | string | number = new Date()) {
  const d = new Date(date);
  // Add 5.5 hours to get the IST calendar date
  const istTime = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
  const year = istTime.getUTCFullYear();
  const month = istTime.getUTCMonth();
  const day = istTime.getUTCDate();

  // Start of day in IST (00:00:00) converted to UTC
  const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  start.setUTCMinutes(start.getUTCMinutes() - 330);

  // End of day in IST (23:59:59.999) converted to UTC
  const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  end.setUTCMinutes(end.getUTCMinutes() - 330);

  return { start, end };
}

/**
 * Check if a date belongs to a specific IST calendar day
 */
export function isSameISTDay(date1: Date, date2: Date | string) {
  const d1 = new Date(date1.getTime() + (5.5 * 60 * 60 * 1000));
  const d2 = new Date(new Date(date2).getTime() + (5.5 * 60 * 60 * 1000));

  return d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate();
}
