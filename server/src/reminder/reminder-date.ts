export type RepeatType = '每年' | '每月' | '每周' | string | null;

function startOfDay(input: Date): Date {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function computeNextOccurrence(
  eventDate: Date,
  repeatType: RepeatType,
  nowInput: Date = new Date(),
): Date | null {
  const now = startOfDay(nowInput);
  const date = startOfDay(eventDate);

  if (!repeatType) return date >= now ? date : null;

  if (repeatType === '每年') {
    date.setFullYear(now.getFullYear());
    if (date < now) date.setFullYear(now.getFullYear() + 1);
    return date;
  }

  if (repeatType === '每月') {
    return nextMonthlyDate(now, eventDate.getDate());
  }

  if (repeatType === '每周') {
    return nextWeeklyDate(now, eventDate.getDay());
  }

  return null;
}

export function nextMonthlyDate(nowInput: Date, targetDay: number): Date {
  const now = startOfDay(nowInput);
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = Math.min(targetDay, new Date(year, month + 1, 0).getDate());
  const candidate = new Date(year, month, day);
  if (candidate >= now) return candidate;

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const nextDay = Math.min(targetDay, new Date(nextYear, nextMonth + 1, 0).getDate());
  return new Date(nextYear, nextMonth, nextDay);
}

export function nextWeeklyDate(nowInput: Date, targetDayOfWeek: number): Date {
  const now = startOfDay(nowInput);
  const diffDays = (targetDayOfWeek - now.getDay() + 7) % 7;
  const candidate = new Date(now);
  candidate.setDate(candidate.getDate() + (diffDays === 0 ? 7 : diffDays));
  return candidate;
}

export function daysUntilDate(targetInput: Date, nowInput: Date = new Date()): number {
  const target = startOfDay(targetInput);
  const now = startOfDay(nowInput);
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
}
