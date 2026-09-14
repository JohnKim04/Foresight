import { JournalEntry, OutcomeCheckIn, OutcomePhase } from "./journal-storage";

export type OutcomeTrendRange = 30 | 90;

export type OutcomeTrend = {
  logCount: number;
  scheduledCount: number;
  responseCount: number;
  numericCount: number;
  notSureCount: number;
  skippedCount: number;
  pendingCount: number;
  betterCount: number;
  sameCount: number;
  worseCount: number;
  average: number | null;
  responseRate: number | null;
  hasEnoughEvidence: boolean;
  sourceEntryIds: string[];
};

function startOfLocalDay(value: Date): Date {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isInRange(value: string, range: OutcomeTrendRange, now: Date): boolean {
  const start = startOfLocalDay(now);
  start.setDate(start.getDate() - (range - 1));
  const end = startOfLocalDay(now);
  end.setDate(end.getDate() + 1);
  return Date.parse(value) >= start.getTime() && Date.parse(value) < end.getTime();
}

export function outcomeTrend(entries: JournalEntry[], checkIns: OutcomeCheckIn[], categoryId: string, phase: OutcomePhase, range: OutcomeTrendRange, now = new Date()): OutcomeTrend {
  const selectedEntries = entries.filter((entry) => entry.categoryIds.includes(categoryId) && isInRange(entry.eventAt, range, now));
  const entryIds = new Set(selectedEntries.map((entry) => entry.id));
  const scoped = checkIns.filter((checkIn) => checkIn.phase === phase && entryIds.has(checkIn.entryId) && !checkIn.excludedFromAnalysis);
  const answered = scoped.filter((checkIn) => checkIn.status === "answered" && checkIn.overall !== null);
  const notSure = scoped.filter((checkIn) => checkIn.status === "not_sure");
  const skipped = scoped.filter((checkIn) => checkIn.status === "skipped");
  const pending = scoped.filter((checkIn) => checkIn.status === "pending");
  const values = answered.map((checkIn) => checkIn.overall!);
  const numericCount = values.length;
  const responseCount = numericCount + notSure.length;
  return {
    logCount: selectedEntries.length,
    scheduledCount: scoped.length,
    responseCount,
    numericCount,
    notSureCount: notSure.length,
    skippedCount: skipped.length,
    pendingCount: pending.length,
    betterCount: values.filter((value) => value > 0).length,
    sameCount: values.filter((value) => value === 0).length,
    worseCount: values.filter((value) => value < 0).length,
    average: numericCount > 0 ? values.reduce<number>((total, value) => total + value, 0) / numericCount : null,
    responseRate: scoped.length > 0 ? responseCount / scoped.length : null,
    hasEnoughEvidence: numericCount >= 5,
    sourceEntryIds: [...new Set(answered.map((checkIn) => checkIn.entryId))],
  };
}

export function describeAverageOutcome(average: number): string {
  if (average <= -1.5) return "much worse";
  if (average < -0.25) return "a little worse";
  if (average <= 0.25) return "about the same";
  if (average < 1.5) return "a little better";
  return "much better";
}
