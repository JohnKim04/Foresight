import { JournalCategory, JournalEntry } from "./journal-storage";

export type TrendRange = 7 | 30 | 90;
export type CategoryTrend = { category: JournalCategory; currentCount: number; previousCount: number; change: number };
export type DailyActivity = { day: string; count: number };

function startOfLocalDay(value: Date): Date {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

function dayKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function countInWindow(entries: JournalEntry[], categoryId: string, start: Date, end: Date): number {
  return entries.filter((entry) => {
    const eventAt = new Date(entry.eventAt).getTime();
    return entry.categoryIds.includes(categoryId) && eventAt >= start.getTime() && eventAt <= end.getTime();
  }).length;
}

export function categoryTrends(entries: JournalEntry[], categories: JournalCategory[], range: TrendRange, now = new Date()): CategoryTrend[] {
  const currentStart = startOfLocalDay(now);
  currentStart.setDate(currentStart.getDate() - (range - 1));
  const end = startOfLocalDay(now);
  end.setDate(end.getDate() + 1);
  end.setMilliseconds(-1);
  const previousEnd = new Date(currentStart);
  previousEnd.setMilliseconds(-1);
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - range);
  return categories
    .map((category) => {
      const currentCount = countInWindow(entries, category.id, currentStart, end);
      const previousCount = countInWindow(entries, category.id, previousStart, previousEnd);
      return { category, currentCount, previousCount, change: currentCount - previousCount };
    })
    .sort((left, right) => right.currentCount - left.currentCount || left.category.name.localeCompare(right.category.name));
}

export function dailyActivity(entries: JournalEntry[], categoryId: string, range: TrendRange, now = new Date()): DailyActivity[] {
  const firstDay = startOfLocalDay(now);
  firstDay.setDate(firstDay.getDate() - (range - 1));
  const counts = new Map<string, number>();
  const days: DailyActivity[] = [];
  for (let offset = 0; offset < range; offset += 1) {
    const day = new Date(firstDay);
    day.setDate(firstDay.getDate() + offset);
    const key = dayKey(day);
    counts.set(key, 0);
    days.push({ day: key, count: 0 });
  }
  for (const entry of entries) {
    if (!entry.categoryIds.includes(categoryId)) continue;
    const key = dayKey(new Date(entry.eventAt));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return days.map((day) => ({ ...day, count: counts.get(day.day) ?? 0 }));
}

export function allDailyActivity(entries: JournalEntry[], range: TrendRange, now = new Date()): DailyActivity[] {
  const firstDay = startOfLocalDay(now);
  firstDay.setDate(firstDay.getDate() - (range - 1));
  const counts = new Map<string, number>();
  const days: DailyActivity[] = [];
  for (let offset = 0; offset < range; offset += 1) {
    const day = new Date(firstDay);
    day.setDate(firstDay.getDate() + offset);
    const key = dayKey(day);
    counts.set(key, 0);
    days.push({ day: key, count: 0 });
  }
  for (const entry of entries) {
    const key = dayKey(new Date(entry.eventAt));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return days.map((day) => ({ ...day, count: counts.get(day.day) ?? 0 }));
}
