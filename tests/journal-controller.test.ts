import assert from "node:assert/strict";
import test from "node:test";
import { categoryTrends } from "../src/category-trends";
import { createJournalController } from "../src/journal-controller";
import { filterEntriesByCategory, JOURNAL_VERSION, KeyValueStore, STORAGE_KEY } from "../src/journal-storage";

function memoryStorage(): KeyValueStore {
  const values = new Map<string, string>();
  return {
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
    async removeItem(key) { values.delete(key); },
  };
}

function fixedController(storage: KeyValueStore) {
  let now = new Date("2026-09-10T10:00:00.000Z");
  let id = 0;
  return {
    controller: createJournalController({
      storage,
      now: () => now,
      createId: (prefix) => `${prefix}-${++id}`,
    }),
    advanceTo: (value: string) => { now = new Date(value); },
  };
}

test("controller migrates v1 data and persists an uncategorized new log", async () => {
  const storage = memoryStorage();
  await storage.setItem(STORAGE_KEY, JSON.stringify([
    { id: "legacy", body: "Before categories", eventAt: "2026-09-09T10:00:00.000Z", createdAt: "2026-09-09T10:00:00.000Z", updatedAt: "2026-09-09T10:00:00.000Z" },
  ]));
  const { controller } = fixedController(storage);
  const migrated = await controller.load();
  const saved = await controller.saveLog(migrated, { body: "No category needed", eventAt: "2026-09-10T10:00:00.000Z", categoryIds: [] });

  assert.equal(saved.version, JOURNAL_VERSION);
  assert.equal(saved.entries.length, 2);
  assert.deepEqual(saved.entries.find((entry) => entry.id === "entry-1")?.categoryIds, []);
  assert.equal((await controller.load()).recoveryNeeded, false);
});

test("controller creates multi-category logs that remain filterable and trendable after reload", async () => {
  const storage = memoryStorage();
  const { controller } = fixedController(storage);
  let journal = await controller.load();
  const created = await controller.addCategory(journal, "Reading");
  journal = created.journal;
  journal = await controller.saveLog(journal, {
    body: "Read after work",
    eventAt: "2026-09-10T10:00:00.000Z",
    categoryIds: [created.category.id, "suggested-workout"],
  });
  const reloaded = await controller.load();

  assert.equal(filterEntriesByCategory(reloaded.entries, created.category.id).length, 1);
  assert.deepEqual(categoryTrends(reloaded.entries, reloaded.categories, 7, new Date("2026-09-10T12:00:00.000Z")).slice(0, 2).map((trend) => trend.category.id), [created.category.id, "suggested-workout"]);
});

test("controller blocks archived categories on new logs while preserving them on edits and trends", async () => {
  const storage = memoryStorage();
  const { controller, advanceTo } = fixedController(storage);
  let journal = await controller.load();
  const created = await controller.addCategory(journal, "Reading");
  journal = await controller.saveLog(created.journal, { body: "First chapter", eventAt: "2026-09-10T10:00:00.000Z", categoryIds: [created.category.id] });
  const original = journal.entries.find((entry) => entry.id === "entry-2")!;
  journal = await controller.archiveCategory(journal, created.category.id);
  const newLog = await controller.saveLog(journal, { body: "Cannot use archived", eventAt: "2026-09-10T11:00:00.000Z", categoryIds: [created.category.id] });
  assert.deepEqual(newLog.entries.find((entry) => entry.id === "entry-3")?.categoryIds, []);

  advanceTo("2026-09-10T12:00:00.000Z");
  const edited = await controller.saveLog(newLog, { id: original.id, body: "Finished the chapter", eventAt: original.eventAt, categoryIds: [] });
  const updated = edited.entries.find((entry) => entry.id === original.id)!;
  assert.equal(updated.createdAt, original.createdAt);
  assert.equal(updated.updatedAt, "2026-09-10T12:00:00.000Z");
  assert.deepEqual(updated.categoryIds, [created.category.id]);
  assert.equal(categoryTrends(edited.entries, edited.categories, 7, new Date("2026-09-10T12:00:00.000Z")).find((trend) => trend.category.id === created.category.id)?.currentCount, 1);
});

test("controller recovers unreadable storage and persists a clean v3 journal afterwards", async () => {
  const storage = memoryStorage();
  await storage.setItem(STORAGE_KEY, "unreadable");
  const { controller } = fixedController(storage);
  assert.equal((await controller.load()).recoveryNeeded, true);
  const recovered = await controller.recover();
  const saved = await controller.saveLog(recovered, { body: "A fresh start", eventAt: "2026-09-10T10:00:00.000Z", categoryIds: [] });
  assert.equal(saved.recoveryNeeded, false);
  assert.equal((await controller.load()).entries.length, 1);
});

test("controller persists immediate and delayed outcome check-in lifecycles", async () => {
  const storage = memoryStorage();
  const { controller, advanceTo } = fixedController(storage);
  let journal = await controller.load();
  journal = await controller.saveLog(journal, { body: "Went for a walk", eventAt: "2026-09-10T10:00:00.000Z", categoryIds: [] });
  const entryId = journal.entries[0].id;

  const created = await controller.createOutcomeCheckIn(journal, { entryId, phase: "immediate" });
  journal = created.journal;
  assert.equal(created.checkIn.id, "outcome-2");
  assert.equal(journal.outcomeCheckIns[0].status, "pending");

  advanceTo("2026-09-10T11:00:00.000Z");
  journal = await controller.answerOutcomeCheckIn(journal, { id: created.checkIn.id, status: "answered", overall: 1, note: "More settled" });
  assert.deepEqual(journal.outcomeCheckIns[0].status, "answered");
  assert.equal(journal.outcomeCheckIns[0].overall, 1);
  assert.equal((await controller.load()).outcomeCheckIns[0].note, "More settled");

  const delayed = await controller.createOutcomeCheckIn(journal, { entryId, phase: "delayed", dueAt: "2026-09-11T08:00:00.000Z" });
  advanceTo("2026-09-11T08:30:00.000Z");
  journal = await controller.answerOutcomeCheckIn(delayed.journal, { id: delayed.checkIn.id, status: "not_sure", note: "Need more time." });
  assert.equal(journal.outcomeCheckIns.find((checkIn) => checkIn.id === delayed.checkIn.id)?.status, "not_sure");
  assert.equal((await controller.load()).outcomeCheckIns.find((checkIn) => checkIn.id === delayed.checkIn.id)?.note, "Need more time.");

  const skipped = await controller.createOutcomeCheckIn(journal, { entryId, phase: "immediate" });
  journal = await controller.skipOutcomeCheckIn(skipped.journal, skipped.checkIn.id);
  assert.equal(journal.outcomeCheckIns.find((checkIn) => checkIn.id === skipped.checkIn.id)?.status, "skipped");

  journal = await controller.removeOutcomeCheckIn(journal, created.checkIn.id);
  assert.equal(journal.outcomeCheckIns.length, 2);
  await assert.rejects(() => controller.createOutcomeCheckIn(journal, { entryId: "missing", phase: "immediate" }), /log no longer exists/);
});
