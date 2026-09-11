import assert from "node:assert/strict";
import test from "node:test";
import { allDailyActivity, categoryTrends, dailyActivity } from "../src/category-trends";
import {
  archiveCategory,
  BACKUP_KEY_PREFIX,
  answerOutcomeCheckIn,
  createOutcomeCheckIn,
  createCategory,
  createEntry,
  defaultCategories,
  filterEntriesByCategory,
  JOURNAL_VERSION,
  KeyValueStore,
  loadEntries,
  recoverUnreadableStorage,
  saveJournal,
  STORAGE_KEY,
  skipOutcomeCheckIn,
  updateEntry,
} from "../src/journal-storage";

function memoryStorage(): KeyValueStore {
  const values = new Map<string, string>();
  return {
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
    async removeItem(key) { values.delete(key); },
  };
}

const firstTime = "2026-09-10T10:00:00.000Z";
const laterTime = "2026-09-10T11:00:00.000Z";

test("migrates v1 arrays with empty category assignments and seeded suggestions", async () => {
  const storage = memoryStorage();
  await storage.setItem(STORAGE_KEY, JSON.stringify([
    { id: "one", body: " Existing log ", eventAt: firstTime, createdAt: firstTime, updatedAt: firstTime },
  ]));

  const journal = await loadEntries(storage);
  assert.equal(journal.version, JOURNAL_VERSION);
  assert.deepEqual(journal.entries[0].categoryIds, []);
  assert.deepEqual(journal.categories.map((category) => category.name), ["Workout", "Alcohol", "Social", "Scrolling", "Sleep", "Work"]);
});

test("creates, updates, saves, and reloads category assignments", async () => {
  const storage = memoryStorage();
  const categories = createCategory(defaultCategories(), "Reading", "reading");
  const entry = createEntry({ body: "  Finished a chapter. ", eventAt: firstTime, categoryIds: ["reading", "reading"] }, { id: "one", createdAt: firstTime });
  const [updated] = updateEntry([entry], "one", { body: "Finished two chapters.", eventAt: laterTime, categoryIds: ["reading"] }, laterTime);
  await saveJournal({ version: JOURNAL_VERSION, entries: [updated], categories, outcomeCheckIns: [] }, storage);

  const journal = await loadEntries(storage);
  assert.equal(journal.entries[0].body, "Finished two chapters.");
  assert.deepEqual(journal.entries[0].categoryIds, ["reading"]);
  assert.equal(journal.entries[0].createdAt, firstTime);
  assert.equal(journal.entries[0].updatedAt, laterTime);
});

test("validates custom categories, archives without changing history, and filters history", () => {
  const categories = createCategory(defaultCategories(), "Reading", "reading");
  assert.throws(() => createCategory(categories, " reading ", "another"), /already exists/);
  const archived = archiveCategory(categories, "reading", laterTime);
  assert.equal(archived.find((category) => category.id === "reading")?.archivedAt, laterTime);

  const entry = createEntry({ body: "Read", eventAt: firstTime, categoryIds: ["reading"] }, { id: "one", createdAt: firstTime });
  assert.deepEqual(filterEntriesByCategory([entry], "reading").map((item) => item.id), ["one"]);
});

test("migrates a v2 envelope while dropping malformed records and unknown category assignments", async () => {
  const storage = memoryStorage();
  await storage.setItem(STORAGE_KEY, JSON.stringify({
    version: 2,
    categories: [{ id: "work", name: "Work", archivedAt: null }, { id: "broken", name: "", archivedAt: null }],
    entries: [
      { id: "good", body: "Valid", eventAt: firstTime, createdAt: firstTime, updatedAt: firstTime, categoryIds: ["work", "missing", "work"] },
      { id: "bad", body: "", eventAt: firstTime, createdAt: firstTime, updatedAt: firstTime, categoryIds: [] },
    ],
  }));

  const journal = await loadEntries(storage);
  assert.equal(journal.entries.length, 1);
  assert.deepEqual(journal.entries[0].categoryIds, ["work"]);
  assert.equal(journal.categories.length, 1);
  assert.deepEqual(journal.outcomeCheckIns, []);
  assert.equal(journal.ignoredEntries, 2);
});

test("persists only valid v3 outcome check-ins that reference existing logs", async () => {
  const storage = memoryStorage();
  await storage.setItem(STORAGE_KEY, JSON.stringify({
    version: JOURNAL_VERSION,
    categories: defaultCategories(),
    entries: [{ id: "one", body: "Valid", eventAt: firstTime, createdAt: firstTime, updatedAt: firstTime, categoryIds: [] }],
    outcomeCheckIns: [
      { id: "valid", entryId: "one", phase: "immediate", status: "answered", dueAt: null, answeredAt: laterTime, overall: -1, note: "A little drained", excludedFromAnalysis: false, createdAt: firstTime, updatedAt: laterTime },
      { id: "unknown-log", entryId: "missing", phase: "immediate", status: "answered", dueAt: null, answeredAt: laterTime, overall: 1, note: "", excludedFromAnalysis: false, createdAt: firstTime, updatedAt: laterTime },
      { id: "bad-status", entryId: "one", phase: "immediate", status: "answered", dueAt: null, answeredAt: null, overall: 1, note: "", excludedFromAnalysis: false, createdAt: firstTime, updatedAt: laterTime },
    ],
  }));

  const journal = await loadEntries(storage);
  assert.deepEqual(journal.outcomeCheckIns.map((checkIn) => [checkIn.id, checkIn.overall, checkIn.note]), [["valid", -1, "A little drained"]]);
  assert.equal(journal.ignoredEntries, 2);
});

test("creates, answers, and skips one-dimensional outcome check-ins", () => {
  const immediate = createOutcomeCheckIn({ entryId: "one", phase: "immediate" }, { id: "outcome-1", createdAt: firstTime });
  assert.deepEqual(immediate, {
    id: "outcome-1", entryId: "one", phase: "immediate", status: "pending", dueAt: null, answeredAt: null,
    overall: null, note: "", excludedFromAnalysis: false, createdAt: firstTime, updatedAt: firstTime,
  });
  const answered = answerOutcomeCheckIn([immediate], "outcome-1", { status: "answered", overall: 2, note: "Felt restored." }, laterTime);
  assert.deepEqual(answered[0], { ...immediate, status: "answered", overall: 2, note: "Felt restored.", answeredAt: laterTime, updatedAt: laterTime });
  const skipped = skipOutcomeCheckIn(answered, "outcome-1", "2026-09-10T12:00:00.000Z");
  assert.deepEqual(skipped[0], { ...answered[0], status: "skipped", overall: null, answeredAt: null, updatedAt: "2026-09-10T12:00:00.000Z" });
  assert.throws(() => createOutcomeCheckIn({ entryId: "one", phase: "delayed" }, { id: "outcome-2", createdAt: firstTime }), /follow-up time/);
  assert.throws(() => answerOutcomeCheckIn([immediate], "outcome-1", { status: "answered" }, laterTime), /overall/);
});

test("keeps unreadable storage recoverable", async () => {
  const storage = memoryStorage();
  await storage.setItem(STORAGE_KEY, "not-json");
  assert.equal((await loadEntries(storage)).recoveryNeeded, true);
  const backupKey = await recoverUnreadableStorage(firstTime, storage);
  assert.ok(backupKey?.startsWith(BACKUP_KEY_PREFIX));
  assert.equal(await storage.getItem(STORAGE_KEY), null);
  assert.equal(await storage.getItem(backupKey ?? ""), "not-json");
});

test("computes local-calendar trend totals, period deltas, and daily activity", () => {
  const categories = [{ id: "work", name: "Work", archivedAt: null }, { id: "sleep", name: "Sleep", archivedAt: laterTime }];
  const entries = [
    createEntry({ body: "Today", eventAt: "2026-09-10T23:00:00.000Z", categoryIds: ["work", "sleep", "work"] }, { id: "today", createdAt: firstTime }),
    createEntry({ body: "Yesterday", eventAt: "2026-09-09T12:00:00.000Z", categoryIds: ["work"] }, { id: "yesterday", createdAt: firstTime }),
    createEntry({ body: "Previous week", eventAt: "2026-09-03T12:00:00.000Z", categoryIds: ["work"] }, { id: "previous", createdAt: firstTime }),
  ];
  const now = new Date("2026-09-10T23:30:00.000Z");
  const trends = categoryTrends(entries, categories, 7, now);
  assert.deepEqual(trends.map((trend) => [trend.category.id, trend.currentCount, trend.previousCount, trend.change]), [["work", 2, 1, 1], ["sleep", 1, 0, 1]]);
  const activity = dailyActivity(entries, "work", 7, now);
  assert.equal(activity.length, 7);
  assert.equal(activity.find((day) => day.day === "2026-09-09")?.count, 1);
  assert.equal(activity.find((day) => day.day === "2026-09-10")?.count, 1);
  const allActivity = allDailyActivity(entries, 7, now);
  assert.equal(allActivity.find((day) => day.day === "2026-09-10")?.count, 1);
  assert.equal(allActivity.reduce((total, day) => total + day.count, 0), 2);
});
