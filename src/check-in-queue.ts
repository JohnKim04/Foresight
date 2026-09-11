import { JournalEntry, JournalSnapshot, OutcomeCheckIn } from "./journal-storage";

export type QueuedCheckIn = { checkIn: OutcomeCheckIn; entry: JournalEntry; due: boolean; overdue: boolean };

export function isCheckInDue(checkIn: OutcomeCheckIn, now = new Date()): boolean {
  return checkIn.phase === "delayed" && checkIn.status === "pending" && checkIn.dueAt !== null && Date.parse(checkIn.dueAt) <= now.getTime();
}

export function delayedCheckInQueue(journal: JournalSnapshot, now = new Date()): QueuedCheckIn[] {
  const entriesById = new Map(journal.entries.map((entry) => [entry.id, entry]));
  return journal.outcomeCheckIns
    .filter((checkIn) => checkIn.phase === "delayed" && checkIn.status === "pending" && checkIn.dueAt !== null)
    .flatMap((checkIn) => {
      const entry = entriesById.get(checkIn.entryId);
      const due = isCheckInDue(checkIn, now);
      return entry ? [{ checkIn, entry, due, overdue: due && Date.parse(checkIn.dueAt!) < now.getTime() }] : [];
    })
    .sort((left, right) => Number(right.due) - Number(left.due) || Date.parse(left.checkIn.dueAt!) - Date.parse(right.checkIn.dueAt!));
}
