import {
  archiveCategory,
  answerOutcomeCheckIn,
  createOutcomeCheckIn,
  createCategory,
  createEntry,
  JournalCategory,
  JournalEntry,
  JournalSnapshot,
  JOURNAL_VERSION,
  KeyValueStore,
  loadEntries,
  OutcomeCheckIn,
  OutcomePhase,
  OutcomeValue,
  recoverUnreadableStorage,
  removeOutcomeCheckIn,
  rescheduleOutcomeCheckIn,
  saveJournal,
  skipOutcomeCheckIn,
  updateEntry,
} from "./journal-storage";

export type JournalControllerDependencies = {
  storage: KeyValueStore;
  now: () => Date;
  createId: (prefix: "entry" | "category" | "outcome") => string;
};

export type SaveLogInput = {
  id?: string;
  body: string;
  eventAt: string;
  categoryIds: string[];
};

export type CreatedCategory = { journal: JournalSnapshot; category: JournalCategory };
export type CreateOutcomeCheckInInput = { entryId: string; phase: OutcomePhase; dueAt?: string | null };
export type AnswerOutcomeCheckInInput = { id: string; status: "answered" | "not_sure"; overall?: OutcomeValue; note?: string; excludedFromAnalysis?: boolean };

export type JournalController = {
  load: () => Promise<JournalSnapshot>;
  saveLog: (journal: JournalSnapshot, input: SaveLogInput) => Promise<JournalSnapshot>;
  addCategory: (journal: JournalSnapshot, name: string) => Promise<CreatedCategory>;
  archiveCategory: (journal: JournalSnapshot, id: string) => Promise<JournalSnapshot>;
  createOutcomeCheckIn: (journal: JournalSnapshot, input: CreateOutcomeCheckInInput) => Promise<{ journal: JournalSnapshot; checkIn: OutcomeCheckIn }>;
  answerOutcomeCheckIn: (journal: JournalSnapshot, input: AnswerOutcomeCheckInInput) => Promise<JournalSnapshot>;
  skipOutcomeCheckIn: (journal: JournalSnapshot, id: string) => Promise<JournalSnapshot>;
  rescheduleOutcomeCheckIn: (journal: JournalSnapshot, id: string, dueAt: string) => Promise<JournalSnapshot>;
  removeOutcomeCheckIn: (journal: JournalSnapshot, id: string) => Promise<JournalSnapshot>;
  recover: () => Promise<JournalSnapshot>;
};

function uniqueActiveIds(ids: string[], categories: JournalCategory[]): string[] {
  const activeIds = new Set(categories.filter((category) => !category.archivedAt).map((category) => category.id));
  return [...new Set(ids.filter((id) => activeIds.has(id)))];
}

async function persist(entries: JournalEntry[], categories: JournalCategory[], outcomeCheckIns: OutcomeCheckIn[], dependencies: JournalControllerDependencies): Promise<JournalSnapshot> {
  await saveJournal({ version: JOURNAL_VERSION, entries, categories, outcomeCheckIns }, dependencies.storage);
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
        return persist([entry, ...journal.entries], journal.categories, journal.outcomeCheckIns, dependencies);
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
      return persist(entries, journal.categories, journal.outcomeCheckIns, dependencies);
    },

    async addCategory(journal, name) {
      const categories = createCategory(journal.categories, name, dependencies.createId("category"));
      const category = categories[categories.length - 1];
      return { journal: await persist(journal.entries, categories, journal.outcomeCheckIns, dependencies), category };
    },

    async archiveCategory(journal, id) {
      const categories = archiveCategory(journal.categories, id, dependencies.now().toISOString());
      return persist(journal.entries, categories, journal.outcomeCheckIns, dependencies);
    },

    async createOutcomeCheckIn(journal, input) {
      if (!journal.entries.some((entry) => entry.id === input.entryId)) throw new Error("That log no longer exists.");
      const checkIn = createOutcomeCheckIn(input, { id: dependencies.createId("outcome"), createdAt: dependencies.now().toISOString() });
      return { journal: await persist(journal.entries, journal.categories, [...journal.outcomeCheckIns, checkIn], dependencies), checkIn };
    },

    async answerOutcomeCheckIn(journal, input) {
      const checkIns = answerOutcomeCheckIn(journal.outcomeCheckIns, input.id, input, dependencies.now().toISOString());
      return persist(journal.entries, journal.categories, checkIns, dependencies);
    },

    async skipOutcomeCheckIn(journal, id) {
      const checkIns = skipOutcomeCheckIn(journal.outcomeCheckIns, id, dependencies.now().toISOString());
      return persist(journal.entries, journal.categories, checkIns, dependencies);
    },

    async rescheduleOutcomeCheckIn(journal, id, dueAt) {
      const checkIns = rescheduleOutcomeCheckIn(journal.outcomeCheckIns, id, dueAt, dependencies.now().toISOString());
      return persist(journal.entries, journal.categories, checkIns, dependencies);
    },

    async removeOutcomeCheckIn(journal, id) {
      const checkIns = removeOutcomeCheckIn(journal.outcomeCheckIns, id);
      return persist(journal.entries, journal.categories, checkIns, dependencies);
    },

    async recover() {
      await recoverUnreadableStorage(dependencies.now().toISOString(), dependencies.storage);
      return loadEntries(dependencies.storage);
    },
  };
}
