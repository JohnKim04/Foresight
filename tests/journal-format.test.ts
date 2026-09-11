import assert from "node:assert/strict";
import test from "node:test";
import { formatLogAccessibilityDateTime, formatLogDateTime, formatLogListDate } from "../src/journal-format";
import { formatOutcomeSummary, formatOutcomeValue } from "../src/outcome-format";

const options = { locale: "en-US", timeZone: "UTC" };
const timestamp = "2026-09-10T14:35:42.000Z";

test("formats a compact list timestamp with date and time but no seconds", () => {
  const formatted = formatLogListDate(timestamp, options);
  assert.equal(formatted, "Sep 10 · 2:35 PM");
  assert.ok(!formatted.includes("42"));
});

test("formats detail and accessibility timestamps without seconds", () => {
  assert.equal(formatLogDateTime(timestamp, options), "Sep 10, 2026, 2:35 PM");
  assert.equal(formatLogAccessibilityDateTime(timestamp, options), "Thursday, September 10, 2026 at 2:35 PM");
});

test("formats overall feeling labels without turning not-sure into neutral", () => {
  assert.equal(formatOutcomeValue(-2), "Much worse");
  assert.equal(formatOutcomeValue(0), "About the same");
  assert.equal(formatOutcomeValue(2), "Much better");
  const base = { id: "outcome-1", entryId: "entry-1", phase: "immediate" as const, dueAt: null, note: "", excludedFromAnalysis: false, createdAt: timestamp, updatedAt: timestamp };
  assert.equal(formatOutcomeSummary({ ...base, status: "answered", overall: -1, answeredAt: timestamp }), "A little worse");
  assert.equal(formatOutcomeSummary({ ...base, status: "not_sure", overall: null, answeredAt: timestamp }), "Not sure yet");
});
