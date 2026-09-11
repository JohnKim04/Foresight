import assert from "node:assert/strict";
import test from "node:test";
import { formatLogAccessibilityDateTime, formatLogDateTime, formatLogListDate } from "../src/journal-format";

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
