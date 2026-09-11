import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEY = "foresight.journal.v1";
export const BACKUP_KEY_PREFIX = "foresight.journal.unreadable.";
export const JOURNAL_VERSION = 2;

const DEFAULT_CATEGORY_NAMES = ["Workout", "Alcohol", "Social", "Scrolling", "Sleep", "Work"];

export type JournalCategory = {
  id: string;
  name: string;
  archivedAt: string | null;
};

export type JournalEntry = {
  id: string;
  body: string;
  eventAt: string;
  createdAt: string;
  updatedAt: string;
  categoryIds: string[];
};

export type JournalStore = {
  version: typeof JOURNAL_VERSION;
  entries: JournalEntry[];
  categories: JournalCategory[];
};

export type JournalSnapshot = JournalStore & {
  recoveryNeeded: boolean;
  ignoredEntries: number;
};

export type KeyValueStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function cleanCategory(category: unknown): JournalCategory | null {
  if (!category || typeof category !== "object") return null;

  const candidate = category as Partial<JournalCategory>;
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  if (typeof candidate.id !== "string" || !candidate.id || !name) return null;
  if (candidate.archivedAt !== null && candidate.archivedAt !== undefined && !isTimestamp(candidate.archivedAt)) return null;

  return {
    id: candidate.id,
    name,
    archivedAt: candidate.archivedAt ? new Date(candidate.archivedAt).toISOString() : null,
  };
}

function cleanCategoryIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))];
}

function cleanEntry(entry: unknown): JournalEntry | null {
  if (!entry || typeof entry !== "object") return null;

  const candidate = entry as Partial<JournalEntry>;
  const body = typeof candidate.body === "string" ? candidate.body.trim() : "";
  if (
    typeof candidate.id !== "string" ||
    candidate.id.length === 0 ||
    body.length === 0 ||
    !isTimestamp(candidate.eventAt) ||
    !isTimestamp(candidate.createdAt) ||
    !isTimestamp(candidate.updatedAt)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    body,
    eventAt: new Date(candidate.eventAt).toISOString(),
    createdAt: new Date(candidate.createdAt).toISOString(),
    updatedAt: new Date(candidate.updatedAt).toISOString(),
    categoryIds: cleanCategoryIds(candidate.categoryIds),
  };
}

export function defaultCategories(): JournalCategory[] {
  return DEFAULT_CATEGORY_NAMES.map((name) => ({
    id: `suggested-${name.toLowerCase()}`,
    name,
    archivedAt: null,
  }));
}

export function sortEntries(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((left, right) => Date.parse(right.eventAt) - Date.parse(left.eventAt));
}

export function createEntry(
  input: Pick<JournalEntry, "body" | "eventAt"> & { categoryIds?: string[] },
  context: Pick<JournalEntry, "id" | "createdAt">,
): JournalEntry {
  const body = input.body.trim();
  if (!body) throw new Error("A journal entry needs text.");
  if (!isTimestamp(input.eventAt)) throw new Error("Choose a valid event time.");
  if (!context.id) throw new Error("A journal entry needs an ID.");
  if (!isTimestamp(context.createdAt)) throw new Error("A journal entry needs a valid creation time.");

  const timestamp = new Date(context.createdAt).toISOString();
  return {
    id: context.id,
    body,
    eventAt: new Date(input.eventAt).toISOString(),
    createdAt: timestamp,
    updatedAt: timestamp,
    categoryIds: cleanCategoryIds(input.categoryIds),
  };
}

export function updateEntry(
  entries: JournalEntry[],
  id: string,
  changes: Pick<JournalEntry, "body" | "eventAt"> & { categoryIds?: string[] },
  updatedAt: string,
): JournalEntry[] {
  const original = entries.find((entry) => entry.id === id);
  if (!original) throw new Error("That journal entry no longer exists.");

  const next = createEntry(
    { ...changes, categoryIds: changes.categoryIds ?? original.categoryIds },
    { id: original.id, createdAt: updatedAt },
  );
  next.createdAt = original.createdAt;
  return sortEntries(entries.map((entry) => (entry.id === id ? next : entry)));
}

export function createCategory(categories: JournalCategory[], name: string, id: string): JournalCategory[] {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("A category needs a name.");
  if (!id) throw new Error("A category needs an ID.");
  if (categories.some((category) => category.name.localeCompare(trimmed, undefined, { sensitivity: "accent" }) === 0)) {
    throw new Error("That category already exists.");
  }
  return [...categories, { id, name: trimmed, archivedAt: null }];
}

export function archiveCategory(categories: JournalCategory[], id: string, archivedAt: string): JournalCategory[] {
  if (!isTimestamp(archivedAt)) throw new Error("Choose a valid archive time.");
  if (!categories.some((category) => category.id === id)) throw new Error("That category no longer exists.");
  return categories.map((category) => (category.id === id ? { ...category, archivedAt: new Date(archivedAt).toISOString() } : category));
}

export function filterEntriesByCategory(entries: JournalEntry[], categoryId: string | null): JournalEntry[] {
  return categoryId ? entries.filter((entry) => entry.categoryIds.includes(categoryId)) : entries;
}

function snapshot(store: JournalStore, ignoredEntries: number): JournalSnapshot {
  return { ...store, entries: sortEntries(store.entries), recoveryNeeded: false, ignoredEntries };
}

export async function loadEntries(storage: KeyValueStore = AsyncStorage): Promise<JournalSnapshot> {
  const raw = await storage.getItem(STORAGE_KEY);
  if (raw === null) return snapshot({ version: JOURNAL_VERSION, entries: [], categories: defaultCategories() }, 0);

  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const entries = parsed.map(cleanEntry).filter((entry): entry is JournalEntry => entry !== null);
      return snapshot({ version: JOURNAL_VERSION, entries, categories: defaultCategories() }, parsed.length - entries.length);
    }
    if (!parsed || typeof parsed !== "object") return { version: JOURNAL_VERSION, entries: [], categories: defaultCategories(), recoveryNeeded: true, ignoredEntries: 0 };

    const candidate = parsed as Partial<JournalStore>;
    if (candidate.version !== JOURNAL_VERSION || !Array.isArray(candidate.entries) || !Array.isArray(candidate.categories)) {
      return { version: JOURNAL_VERSION, entries: [], categories: defaultCategories(), recoveryNeeded: true, ignoredEntries: 0 };
    }

    const parsedCategories = candidate.categories.map(cleanCategory).filter((item): item is JournalCategory => item !== null);
    const categories = parsedCategories.filter((category, index) => parsedCategories.findIndex((item) => item.id === category.id) === index);
    const allowedIds = new Set(categories.map((category) => category.id));
    const cleanEntries = candidate.entries.map(cleanEntry).filter((entry): entry is JournalEntry => entry !== null);
    const entries = cleanEntries.map((entry) => ({ ...entry, categoryIds: entry.categoryIds.filter((id) => allowedIds.has(id)) }));
    return snapshot(
      { version: JOURNAL_VERSION, entries, categories },
      candidate.entries.length - cleanEntries.length + candidate.categories.length - categories.length,
    );
  } catch {
    return { version: JOURNAL_VERSION, entries: [], categories: defaultCategories(), recoveryNeeded: true, ignoredEntries: 0 };
  }
}

export async function saveJournal(store: JournalStore, storage: KeyValueStore = AsyncStorage): Promise<void> {
  const parsedCategories = store.categories.map(cleanCategory).filter((item): item is JournalCategory => item !== null);
  const categories = parsedCategories.filter((category, index) => parsedCategories.findIndex((item) => item.id === category.id) === index);
  const allowedIds = new Set(categories.map((category) => category.id));
  const entries = store.entries
    .map(cleanEntry)
    .filter((entry): entry is JournalEntry => entry !== null)
    .map((entry) => ({ ...entry, categoryIds: entry.categoryIds.filter((id) => allowedIds.has(id)) }));
  await storage.setItem(STORAGE_KEY, JSON.stringify({ version: JOURNAL_VERSION, entries: sortEntries(entries), categories }));
}

export async function recoverUnreadableStorage(recoveryAt: string, storage: KeyValueStore = AsyncStorage): Promise<string | null> {
  if (!isTimestamp(recoveryAt)) throw new Error("A recovery needs a valid timestamp.");
  const raw = await storage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  const backupKey = `${BACKUP_KEY_PREFIX}${new Date(recoveryAt).toISOString()}`;
  await storage.setItem(backupKey, raw);
  await storage.removeItem(STORAGE_KEY);
  return backupKey;
}
