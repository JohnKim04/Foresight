import assert from "node:assert/strict";
import test from "node:test";
import { describeAverageOutcome, outcomeTrend } from "../src/outcome-trends";
import { createEntry, OutcomeCheckIn } from "../src/journal-storage";

const createdAt = "2026-09-10T10:00:00.000Z";
const now = new Date("2026-09-10T12:00:00.000Z");

function checkIn(id: string, entryId: string, status: OutcomeCheckIn["status"], overall: OutcomeCheckIn["overall"], extra: Partial<OutcomeCheckIn> = {}): OutcomeCheckIn {
  return { id, entryId, phase: "delayed", status, dueAt: "2026-09-10T08:00:00.000Z", answeredAt: status === "answered" || status === "not_sure" ? createdAt : null, overall, note: "", excludedFromAnalysis: false, createdAt, updatedAt: createdAt, ...extra };
}

test("aggregates category outcomes without treating skipped, unsure, or excluded records as numeric evidence", () => {
  const entries = [
    createEntry({ body: "First", eventAt: "2026-09-10T09:00:00.000Z", categoryIds: ["alcohol"] }, { id: "one", createdAt }),
    createEntry({ body: "Second", eventAt: "2026-09-09T09:00:00.000Z", categoryIds: ["alcohol"] }, { id: "two", createdAt }),
    createEntry({ body: "Old", eventAt: "2026-07-01T09:00:00.000Z", categoryIds: ["alcohol"] }, { id: "old", createdAt }),
  ];
  const trend = outcomeTrend(entries, [
    checkIn("one", "one", "answered", -2), checkIn("two", "two", "answered", 1), checkIn("three", "two", "answered", 0),
    checkIn("four", "one", "not_sure", null), checkIn("five", "one", "skipped", null), checkIn("six", "two", "pending", null),
    checkIn("excluded", "two", "answered", 2, { excludedFromAnalysis: true }), checkIn("old", "old", "answered", -2),
  ], "alcohol", "delayed", 30, now);

  assert.deepEqual(trend, {
    logCount: 2, scheduledCount: 6, responseCount: 4, numericCount: 3, notSureCount: 1, skippedCount: 1, pendingCount: 1,
    betterCount: 1, sameCount: 1, worseCount: 1, average: -1 / 3, responseRate: 4 / 6, hasEnoughEvidence: false, sourceEntryIds: ["one", "two"],
  });
});

test("requires five numeric outcomes before describing a pattern", () => {
  const entries = Array.from({ length: 5 }, (_, index) => createEntry({ body: `Log ${index}`, eventAt: "2026-09-10T09:00:00.000Z", categoryIds: ["workout"] }, { id: `entry-${index}`, createdAt }));
  const checkIns = entries.map((entry, index) => checkIn(`outcome-${index}`, entry.id, "answered", 1));
  const trend = outcomeTrend(entries, checkIns, "workout", "delayed", 90, now);
  assert.equal(trend.hasEnoughEvidence, true);
  assert.equal(trend.average, 1);
  assert.equal(describeAverageOutcome(trend.average!), "a little better");
  assert.equal(describeAverageOutcome(-2), "much worse");
  assert.equal(describeAverageOutcome(0), "about the same");
});
