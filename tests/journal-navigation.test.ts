import assert from "node:assert/strict";
import test from "node:test";
import {
  journalRoute,
  leaveFocusedRoute,
  openDetail,
  openEditComposer,
  openNewComposer,
  openOutcomeCheckIn,
  resolveRoute,
  routeAfterSave,
} from "../src/journal-navigation";

test("moves from Journal to detail and back", () => {
  const detail = openDetail("entry-1");
  assert.deepEqual(detail, { screen: "detail", entryId: "entry-1" });
  assert.deepEqual(leaveFocusedRoute(detail), journalRoute);
});

test("moves a new composer to the saved entry detail", () => {
  assert.deepEqual(openNewComposer(), { screen: "composer", mode: "new", origin: "journal" });
  assert.deepEqual(routeAfterSave("entry-1"), { screen: "detail", entryId: "entry-1" });
  assert.deepEqual(leaveFocusedRoute(openNewComposer()), journalRoute);
});

test("returns an edit composer to its originating detail when cancelled", () => {
  const composer = openEditComposer("entry-1");
  assert.deepEqual(composer, { screen: "composer", mode: "edit", origin: "detail", entryId: "entry-1" });
  assert.deepEqual(leaveFocusedRoute(composer), openDetail("entry-1"));
});

test("falls back to Journal when a focused entry is unavailable", () => {
  assert.equal(resolveRoute(openDetail("missing"), new Set(["entry-1"])), journalRoute);
  assert.equal(resolveRoute(openEditComposer("missing"), new Set(["entry-1"])), journalRoute);
  const available = openDetail("entry-1");
  assert.equal(resolveRoute(available, new Set(["entry-1"])), available);
});

test("returns an outcome check-in to its log and rejects unavailable check-ins", () => {
  const checkIn = openOutcomeCheckIn("entry-1", "outcome-1");
  assert.deepEqual(checkIn, { screen: "outcome-check-in", entryId: "entry-1", checkInId: "outcome-1" });
  assert.deepEqual(leaveFocusedRoute(checkIn), openDetail("entry-1"));
  assert.equal(resolveRoute(checkIn, new Set(["entry-1"]), new Set()), journalRoute);
  assert.equal(resolveRoute(checkIn, new Set(["entry-1"]), new Set(["outcome-1"])), checkIn);
  const newCheckIn = openOutcomeCheckIn("entry-1", null);
  assert.equal(resolveRoute(newCheckIn, new Set(["entry-1"])), newCheckIn);
});
