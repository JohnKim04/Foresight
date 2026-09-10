import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEY = "foresight.journal.v1";
export const BACKUP_KEY_PREFIX = "foresight.journal.unreadable.";

export type JournalEntry = {
  id: string;
  body: string;
  eventAt: string;
  createdAt: string;
  updatedAt: string;
};

export type JournalSnapshot = {
  entries: JournalEntry[];
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
  };
}

export function sortEntries(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((left, right) => Date.parse(right.eventAt) - Date.parse(left.eventAt));
}

export function createEntry(
  input: Pick<JournalEntry, "body" | "eventAt">,
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
  };
}

export function updateEntry(
  entries: JournalEntry[],
  id: string,
  changes: Pick<JournalEntry, "body" | "eventAt">,
  updatedAt: string,
): JournalEntry[] {
  const original = entries.find((entry) => entry.id === id);
  if (!original) throw new Error("That journal entry no longer exists.");

  const next = createEntry(changes, { id: original.id, createdAt: updatedAt });
  next.createdAt = original.createdAt;

  return sortEntries(entries.map((entry) => (entry.id === id ? next : entry)));
}

export async function loadEntries(storage: KeyValueStore = AsyncStorage): Promise<JournalSnapshot> {
  const raw = await storage.getItem(STORAGE_KEY);
  if (raw === null) return { entries: [], recoveryNeeded: false, ignoredEntries: 0 };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { entries: [], recoveryNeeded: true, ignoredEntries: 0 };

    const entries = parsed.map(cleanEntry).filter((entry): entry is JournalEntry => entry !== null);
    return {
      entries: sortEntries(entries),
      recoveryNeeded: false,
      ignoredEntries: parsed.length - entries.length,
    };
  } catch {
    return { entries: [], recoveryNeeded: true, ignoredEntries: 0 };
  }
}

export async function saveEntries(
  entries: JournalEntry[],
  storage: KeyValueStore = AsyncStorage,
): Promise<void> {
  const validEntries = entries.map(cleanEntry).filter((entry): entry is JournalEntry => entry !== null);
  await storage.setItem(STORAGE_KEY, JSON.stringify(sortEntries(validEntries)));
}

export async function recoverUnreadableStorage(
  recoveryAt: string,
  storage: KeyValueStore = AsyncStorage,
): Promise<string | null> {
  if (!isTimestamp(recoveryAt)) throw new Error("A recovery needs a valid timestamp.");
  const raw = await storage.getItem(STORAGE_KEY);
  if (raw === null) return null;

  const backupKey = `${BACKUP_KEY_PREFIX}${new Date(recoveryAt).toISOString()}`;
  await storage.setItem(backupKey, raw);
  await storage.removeItem(STORAGE_KEY);
  return backupKey;
}
