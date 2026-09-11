import assert from "node:assert/strict";
import test from "node:test";
import { delayedCheckInQueue, isCheckInDue } from "../src/check-in-queue";
import { createEntry, JournalSnapshot, OutcomeCheckIn } from "../src/journal-storage";

const createdAt = "2026-09-10T10:00:00.000Z";
const now = new Date("2026-09-11T10:00:00.000Z");

function checkIn(id: string, entryId: string, dueAt: string, status: OutcomeCheckIn["status"] = "pending"): OutcomeCheckIn {
  return { id, entryId, phase: "delayed", status, dueAt, answeredAt: status === "answered" ? dueAt : null, overall: status === "answered" ? 1 : null, note: "", excludedFromAnalysis: false, createdAt, updatedAt: createdAt };
}

test("queues only pending delayed check-ins, with due items before upcoming items", () => {
  const first = createEntry({ body: "First log", eventAt: createdAt }, { id: "one", createdAt });
  const second = createEntry({ body: "Second log", eventAt: createdAt }, { id: "two", createdAt });
  const journal: JournalSnapshot = {
    version: 3,
    entries: [first, second],
    categories: [],
    outcomeCheckIns: [
      checkIn("upcoming", "one", "2026-09-12T09:00:00.000Z"),
      checkIn("overdue", "two", "2026-09-10T09:00:00.000Z"),
      checkIn("due", "one", "2026-09-11T10:00:00.000Z"),
      checkIn("answered", "two", "2026-09-10T08:00:00.000Z", "answered"),
    ],
    recoveryNeeded: false,
    ignoredEntries: 0,
  };

  assert.equal(isCheckInDue(journal.outcomeCheckIns[2], now), true);
  assert.equal(isCheckInDue(journal.outcomeCheckIns[0], now), false);
  assert.deepEqual(delayedCheckInQueue(journal, now).map((item) => [item.checkIn.id, item.due, item.overdue, item.entry.id]), [
    ["overdue", true, true, "two"],
    ["due", true, false, "one"],
    ["upcoming", false, false, "one"],
  ]);
});
