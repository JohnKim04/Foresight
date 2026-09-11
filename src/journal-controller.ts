import {
  archiveCategory,
  createCategory,
  createEntry,
  JournalCategory,
  JournalEntry,
  JournalSnapshot,
  JOURNAL_VERSION,
  KeyValueStore,
  loadEntries,
  recoverUnreadableStorage,
  saveJournal,
  updateEntry,
} from "./journal-storage";

export type JournalControllerDependencies = {
  storage: KeyValueStore;
  now: () => Date;
  createId: (prefix: "entry" | "category") => string;
};

export type SaveLogInput = {
  id?: string;
  body: string;
  eventAt: string;
  categoryIds: string[];
};

export type CreatedCategory = { journal: JournalSnapshot; category: JournalCategory };

export type JournalController = {
  load: () => Promise<JournalSnapshot>;
  saveLog: (journal: JournalSnapshot, input: SaveLogInput) => Promise<JournalSnapshot>;
  addCategory: (journal: JournalSnapshot, name: string) => Promise<CreatedCategory>;
  archiveCategory: (journal: JournalSnapshot, id: string) => Promise<JournalSnapshot>;
  recover: () => Promise<JournalSnapshot>;
};

function uniqueActiveIds(ids: string[], categories: JournalCategory[]): string[] {
  const activeIds = new Set(categories.filter((category) => !category.archivedAt).map((category) => category.id));
  return [...new Set(ids.filter((id) => activeIds.has(id)))];
}

async function persist(entries: JournalEntry[], categories: JournalCategory[], dependencies: JournalControllerDependencies): Promise<JournalSnapshot> {
  await saveJournal({ version: JOURNAL_VERSION, entries, categories }, dependencies.storage);
  return loadEntries(dependencies.storage);
}

export function createJournalController(dependencies: JournalControllerDependencies): JournalController {
  return {
    load: () => loadEntries(dependencies.storage),

    async saveLog(journal, input) {
      const now = dependencies.now().toISOString();
      const activeCategoryIds = uniqueActiveIds(input.categoryIds, journal.categories);

      if (!input.id) {
        const entry = createEntry(
          { body: input.body, eventAt: input.eventAt, categoryIds: activeCategoryIds },
          { id: dependencies.createId("entry"), createdAt: now },
        );
        return persist([entry, ...journal.entries], journal.categories, dependencies);
      }

      const original = journal.entries.find((entry) => entry.id === input.id);
      if (!original) throw new Error("That journal entry no longer exists.");
      const archivedIds = original.categoryIds.filter((id) => journal.categories.some((category) => category.id === id && category.archivedAt));
      const entries = updateEntry(
        journal.entries,
        input.id,
        { body: input.body, eventAt: input.eventAt, categoryIds: [...new Set([...activeCategoryIds, ...archivedIds])] },
        now,
      );
      return persist(entries, journal.categories, dependencies);
    },

    async addCategory(journal, name) {
      const categories = createCategory(journal.categories, name, dependencies.createId("category"));
      const category = categories[categories.length - 1];
      return { journal: await persist(journal.entries, categories, dependencies), category };
    },

    async archiveCategory(journal, id) {
      const categories = archiveCategory(journal.categories, id, dependencies.now().toISOString());
      return persist(journal.entries, categories, dependencies);
    },

    async recover() {
      await recoverUnreadableStorage(dependencies.now().toISOString(), dependencies.storage);
      return loadEntries(dependencies.storage);
    },
  };
}
