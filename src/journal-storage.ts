import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEY = "foresight.journal.v1";
export const BACKUP_KEY_PREFIX = "foresight.journal.unreadable.";
export const JOURNAL_VERSION = 3;

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

export type OutcomePhase = "immediate" | "delayed";
export type OutcomeValue = -2 | -1 | 0 | 1 | 2;
export type OutcomeStatus = "pending" | "answered" | "not_sure" | "skipped";

export type OutcomeCheckIn = {
  id: string;
  entryId: string;
  phase: OutcomePhase;
  status: OutcomeStatus;
  dueAt: string | null;
  answeredAt: string | null;
  overall: OutcomeValue | null;
  note: string;
  excludedFromAnalysis: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JournalStore = {
  version: typeof JOURNAL_VERSION;
  entries: JournalEntry[];
  categories: JournalCategory[];
  outcomeCheckIns: OutcomeCheckIn[];
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

type UnknownJournalEnvelope = {
  version?: unknown;
  entries?: unknown;
  categories?: unknown;
  outcomeCheckIns?: unknown;
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

function isOutcomeValue(value: unknown): value is OutcomeValue {
  return value === -2 || value === -1 || value === 0 || value === 1 || value === 2;
}

function isOutcomePhase(value: unknown): value is OutcomePhase {
  return value === "immediate" || value === "delayed";
}

function isOutcomeStatus(value: unknown): value is OutcomeStatus {
  return value === "pending" || value === "answered" || value === "not_sure" || value === "skipped";
}

function cleanOutcomeNote(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const note = value.trim();
  return note.length <= 5000 ? note : null;
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

function cleanOutcomeCheckIn(checkIn: unknown): OutcomeCheckIn | null {
  if (!checkIn || typeof checkIn !== "object") return null;

  const candidate = checkIn as Partial<OutcomeCheckIn>;
  const note = cleanOutcomeNote(candidate.note);
  if (
    typeof candidate.id !== "string" || !candidate.id ||
    typeof candidate.entryId !== "string" || !candidate.entryId ||
    !isOutcomePhase(candidate.phase) ||
    !isOutcomeStatus(candidate.status) ||
    note === null ||
    typeof candidate.excludedFromAnalysis !== "boolean" ||
    !isTimestamp(candidate.createdAt) ||
    !isTimestamp(candidate.updatedAt)
  ) {
    return null;
  }

  const dueAt = candidate.dueAt === null ? null : isTimestamp(candidate.dueAt) ? new Date(candidate.dueAt).toISOString() : null;
  const answeredAt = candidate.answeredAt === null ? null : isTimestamp(candidate.answeredAt) ? new Date(candidate.answeredAt).toISOString() : null;
  if ((candidate.dueAt !== null && dueAt === null) || (candidate.answeredAt !== null && answeredAt === null)) return null;
  if (candidate.phase === "immediate" && dueAt !== null) return null;

  if (candidate.status === "pending" || candidate.status === "skipped") {
    if (candidate.overall !== null || answeredAt !== null) return null;
  } else if (candidate.status === "answered") {
    if (!isOutcomeValue(candidate.overall) || answeredAt === null) return null;
  } else if (candidate.status === "not_sure") {
    if (candidate.overall !== null || answeredAt === null) return null;
  }

  return {
    id: candidate.id,
    entryId: candidate.entryId,
    phase: candidate.phase,
    status: candidate.status,
    dueAt,
    answeredAt,
    overall: candidate.status === "answered" ? candidate.overall as OutcomeValue : null,
    note,
    excludedFromAnalysis: candidate.excludedFromAnalysis,
    createdAt: new Date(candidate.createdAt).toISOString(),
    updatedAt: new Date(candidate.updatedAt).toISOString(),
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

export function createOutcomeCheckIn(
  input: Pick<OutcomeCheckIn, "entryId" | "phase"> & { dueAt?: string | null },
  context: Pick<OutcomeCheckIn, "id" | "createdAt">,
): OutcomeCheckIn {
  if (!input.entryId) throw new Error("An outcome check-in needs a log.");
  if (!isOutcomePhase(input.phase)) throw new Error("Choose a valid check-in timing.");
  if (!context.id) throw new Error("An outcome check-in needs an ID.");
  if (!isTimestamp(context.createdAt)) throw new Error("An outcome check-in needs a valid creation time.");
  if (input.phase === "immediate" && input.dueAt != null) throw new Error("An immediate check-in cannot be scheduled for later.");
  if (input.phase === "delayed" && !isTimestamp(input.dueAt)) throw new Error("Choose a valid follow-up time.");

  const timestamp = new Date(context.createdAt).toISOString();
  return {
    id: context.id,
    entryId: input.entryId,
    phase: input.phase,
    status: "pending",
    dueAt: input.phase === "delayed" ? new Date(input.dueAt!).toISOString() : null,
    answeredAt: null,
    overall: null,
    note: "",
    excludedFromAnalysis: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function answerOutcomeCheckIn(
  checkIns: OutcomeCheckIn[],
  id: string,
  input: { overall?: OutcomeValue; status: "answered" | "not_sure"; note?: string; excludedFromAnalysis?: boolean },
  answeredAt: string,
): OutcomeCheckIn[] {
  if (!isTimestamp(answeredAt)) throw new Error("Choose a valid response time.");
  const original = checkIns.find((checkIn) => checkIn.id === id);
  if (!original) throw new Error("That outcome check-in no longer exists.");
  if (input.status === "answered" && !isOutcomeValue(input.overall)) throw new Error("Choose how you felt overall.");
  if (input.status === "not_sure" && input.overall !== undefined) throw new Error("A not-sure response cannot include an overall rating.");
  const note = input.note === undefined ? original.note : cleanOutcomeNote(input.note);
  if (note === null) throw new Error("Keep the reflection note under 5,000 characters.");

  const timestamp = new Date(answeredAt).toISOString();
  const next: OutcomeCheckIn = {
    ...original,
    status: input.status,
    overall: input.status === "answered" ? input.overall! : null,
    answeredAt: timestamp,
    note,
    excludedFromAnalysis: input.excludedFromAnalysis ?? original.excludedFromAnalysis,
    updatedAt: timestamp,
  };
  return checkIns.map((checkIn) => checkIn.id === id ? next : checkIn);
}

export function skipOutcomeCheckIn(checkIns: OutcomeCheckIn[], id: string, skippedAt: string): OutcomeCheckIn[] {
  if (!isTimestamp(skippedAt)) throw new Error("Choose a valid skip time.");
  const original = checkIns.find((checkIn) => checkIn.id === id);
  if (!original) throw new Error("That outcome check-in no longer exists.");
  const timestamp = new Date(skippedAt).toISOString();
  return checkIns.map((checkIn) => checkIn.id === id ? {
    ...original,
    status: "skipped",
    overall: null,
    answeredAt: null,
    updatedAt: timestamp,
  } : checkIn);
}

export function rescheduleOutcomeCheckIn(checkIns: OutcomeCheckIn[], id: string, dueAt: string, updatedAt: string): OutcomeCheckIn[] {
  if (!isTimestamp(dueAt) || !isTimestamp(updatedAt)) throw new Error("Choose a valid follow-up time.");
  if (Date.parse(dueAt) <= Date.parse(updatedAt)) throw new Error("Choose a follow-up time in the future.");
  const original = checkIns.find((checkIn) => checkIn.id === id);
  if (!original) throw new Error("That outcome check-in no longer exists.");
  if (original.phase !== "delayed" || original.status !== "pending") throw new Error("Only a pending delayed check-in can be rescheduled.");
  const timestamp = new Date(updatedAt).toISOString();
  return checkIns.map((checkIn) => checkIn.id === id ? {
    ...original,
    dueAt: new Date(dueAt).toISOString(),
    updatedAt: timestamp,
  } : checkIn);
}

export function removeOutcomeCheckIn(checkIns: OutcomeCheckIn[], id: string): OutcomeCheckIn[] {
  if (!checkIns.some((checkIn) => checkIn.id === id)) throw new Error("That outcome check-in no longer exists.");
  return checkIns.filter((checkIn) => checkIn.id !== id);
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

function cleanStore(entriesValue: unknown[], categoriesValue: unknown[], outcomeCheckInsValue: unknown[]): JournalSnapshot {
  const parsedCategories = categoriesValue.map(cleanCategory).filter((item): item is JournalCategory => item !== null);
  const categories = parsedCategories.filter((category, index) => parsedCategories.findIndex((item) => item.id === category.id) === index);
  const allowedIds = new Set(categories.map((category) => category.id));
  const cleanEntries = entriesValue.map(cleanEntry).filter((entry): entry is JournalEntry => entry !== null);
  const entries = cleanEntries.map((entry) => ({ ...entry, categoryIds: entry.categoryIds.filter((id) => allowedIds.has(id)) }));
  const entryIds = new Set(entries.map((entry) => entry.id));
  const parsedCheckIns = outcomeCheckInsValue.map(cleanOutcomeCheckIn).filter((item): item is OutcomeCheckIn => item !== null);
  const outcomeCheckIns = parsedCheckIns
    .filter((checkIn, index) => parsedCheckIns.findIndex((item) => item.id === checkIn.id) === index)
    .filter((checkIn) => entryIds.has(checkIn.entryId));
  const ignoredEntries =
    entriesValue.length - cleanEntries.length +
    categoriesValue.length - categories.length +
    outcomeCheckInsValue.length - outcomeCheckIns.length;
  return snapshot({ version: JOURNAL_VERSION, entries, categories, outcomeCheckIns }, ignoredEntries);
}

export async function loadEntries(storage: KeyValueStore = AsyncStorage): Promise<JournalSnapshot> {
  const raw = await storage.getItem(STORAGE_KEY);
  if (raw === null) return snapshot({ version: JOURNAL_VERSION, entries: [], categories: defaultCategories(), outcomeCheckIns: [] }, 0);

  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const entries = parsed.map(cleanEntry).filter((entry): entry is JournalEntry => entry !== null);
      return snapshot({ version: JOURNAL_VERSION, entries, categories: defaultCategories(), outcomeCheckIns: [] }, parsed.length - entries.length);
    }
    if (!parsed || typeof parsed !== "object") return { version: JOURNAL_VERSION, entries: [], categories: defaultCategories(), outcomeCheckIns: [], recoveryNeeded: true, ignoredEntries: 0 };

    const candidate = parsed as UnknownJournalEnvelope;
    if (candidate.version === 2 && Array.isArray(candidate.entries) && Array.isArray(candidate.categories)) {
      return cleanStore(candidate.entries, candidate.categories, []);
    }
    if (candidate.version === JOURNAL_VERSION && Array.isArray(candidate.entries) && Array.isArray(candidate.categories) && Array.isArray(candidate.outcomeCheckIns)) {
      return cleanStore(candidate.entries, candidate.categories, candidate.outcomeCheckIns);
    }
    return { version: JOURNAL_VERSION, entries: [], categories: defaultCategories(), outcomeCheckIns: [], recoveryNeeded: true, ignoredEntries: 0 };
  } catch {
    return { version: JOURNAL_VERSION, entries: [], categories: defaultCategories(), outcomeCheckIns: [], recoveryNeeded: true, ignoredEntries: 0 };
  }
}

export async function saveJournal(store: JournalStore, storage: KeyValueStore = AsyncStorage): Promise<void> {
  const cleaned = cleanStore(store.entries, store.categories, store.outcomeCheckIns);
  await storage.setItem(STORAGE_KEY, JSON.stringify({ version: JOURNAL_VERSION, entries: cleaned.entries, categories: cleaned.categories, outcomeCheckIns: cleaned.outcomeCheckIns }));
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
