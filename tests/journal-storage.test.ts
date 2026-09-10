import assert from "node:assert/strict";
import test from "node:test";
import {
  BACKUP_KEY_PREFIX,
  createEntry,
  KeyValueStore,
  loadEntries,
  recoverUnreadableStorage,
  saveEntries,
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

test("creates a trimmed entry with stable timestamps", () => {
  const entry = createEntry(
    { body: "  A quiet walk after work.  ", eventAt: "2026-09-10T09:30:00.000Z" },
    { id: "one", createdAt: firstTime },
  );

  assert.deepEqual(entry, {
    id: "one",
    body: "A quiet walk after work.",
    eventAt: "2026-09-10T09:30:00.000Z",
    createdAt: firstTime,
    updatedAt: firstTime,
  });
});

test("rejects entries without text or a valid event time", () => {
  assert.throws(() => createEntry({ body: "   ", eventAt: firstTime }, { id: "one", createdAt: firstTime }));
  assert.throws(() => createEntry({ body: "A note", eventAt: "noonish" }, { id: "one", createdAt: firstTime }));
});

test("saves, reloads, and sorts entries by event time", async () => {
  const storage = memoryStorage();
  const early = createEntry({ body: "Early", eventAt: "2026-09-09T09:00:00.000Z" }, { id: "early", createdAt: firstTime });
  const late = createEntry({ body: "Late", eventAt: "2026-09-10T09:00:00.000Z" }, { id: "late", createdAt: laterTime });

  await saveEntries([early, late], storage);
  const journal = await loadEntries(storage);

  assert.equal(journal.recoveryNeeded, false);
  assert.deepEqual(journal.entries.map((entry) => entry.id), ["late", "early"]);
});

test("updates content and event time while preserving creation time", () => {
  const original = createEntry({ body: "Original", eventAt: "2026-09-09T09:00:00.000Z" }, { id: "one", createdAt: firstTime });
  const [updated] = updateEntry(
    [original],
    "one",
    { body: "Updated log", eventAt: "2026-09-10T12:00:00.000Z" },
    laterTime,
  );

  assert.equal(updated.id, "one");
  assert.equal(updated.body, "Updated log");
  assert.equal(updated.createdAt, firstTime);
  assert.equal(updated.updatedAt, laterTime);
  assert.equal(updated.eventAt, "2026-09-10T12:00:00.000Z");
});

test("filters malformed records without losing valid entries", async () => {
  const storage = memoryStorage();
  await storage.setItem(STORAGE_KEY, JSON.stringify([
    { id: "valid", body: "Valid", eventAt: firstTime, createdAt: firstTime, updatedAt: firstTime },
    { id: "broken", body: "", eventAt: firstTime, createdAt: firstTime, updatedAt: firstTime },
  ]));

  const journal = await loadEntries(storage);
  assert.equal(journal.entries.length, 1);
  assert.equal(journal.entries[0].id, "valid");
  assert.equal(journal.ignoredEntries, 1);
});

test("marks unreadable storage for recovery and keeps a backup when recovered", async () => {
  const storage = memoryStorage();
  await storage.setItem(STORAGE_KEY, "not-json");

  assert.equal((await loadEntries(storage)).recoveryNeeded, true);
  const backupKey = await recoverUnreadableStorage(firstTime, storage);

  assert.ok(backupKey?.startsWith(BACKUP_KEY_PREFIX));
  assert.equal(await storage.getItem(STORAGE_KEY), null);
  assert.equal(await storage.getItem(backupKey ?? ""), "not-json");
  assert.equal((await loadEntries(storage)).recoveryNeeded, false);
});
