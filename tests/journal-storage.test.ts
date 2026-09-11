import assert from "node:assert/strict";
import test from "node:test";
import { allDailyActivity, categoryTrends, dailyActivity } from "../src/category-trends";
import {
  archiveCategory,
  BACKUP_KEY_PREFIX,
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
  await saveJournal({ version: JOURNAL_VERSION, entries: [updated], categories }, storage);

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

test("drops malformed records and unknown category assignments from a v2 envelope", async () => {
  const storage = memoryStorage();
  await storage.setItem(STORAGE_KEY, JSON.stringify({
    version: JOURNAL_VERSION,
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
  assert.equal(journal.ignoredEntries, 2);
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
