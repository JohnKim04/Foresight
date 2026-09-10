import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createEntry,
  JournalEntry,
  JournalSnapshot,
  loadEntries,
  recoverUnreadableStorage,
  saveEntries,
  updateEntry,
} from "./src/journal-storage";

const blankSnapshot: JournalSnapshot = { entries: [], recoveryNeeded: false, ignoredEntries: 0 };

function makeEntryId(): string {
  return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function displayDate(timestamp: string, includeTime = true): string {
  const date = new Date(timestamp);
  return includeTime ? date.toLocaleString() : date.toLocaleDateString();
}

export default function App() {
  const [journal, setJournal] = useState<JournalSnapshot>(blankSnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date());
  const [pickerMode, setPickerMode] = useState<"date" | "time" | "datetime" | null>(null);
  const [status, setStatus] = useState("");

  const selectedEntry = useMemo(
    () => journal.entries.find((entry) => entry.id === selectedId) ?? null,
    [journal.entries, selectedId],
  );

  const resetComposer = useCallback(() => {
    setEditingId(null);
    setBody("");
    setEventDate(new Date());
    setPickerMode(null);
  }, []);

  const hydrate = useCallback(async () => {
    try {
      const snapshot = await loadEntries();
      setJournal(snapshot);
    } catch {
      setStatus("Your journal could not be opened. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const persist = useCallback(async (entries: JournalEntry[]) => {
    await saveEntries(entries);
    setJournal((current) => ({ ...current, entries, recoveryNeeded: false }));
  }, []);

  async function handleSave() {
    if (!body.trim()) return;

    try {
      if (editingId) {
        const entries = updateEntry(
          journal.entries,
          editingId,
          { body, eventAt: eventDate.toISOString() },
          new Date().toISOString(),
        );
        await persist(entries);
        setSelectedId(editingId);
        setStatus("Log updated.");
      } else {
        const entry = createEntry(
          { body, eventAt: eventDate.toISOString() },
          { id: makeEntryId(), createdAt: new Date().toISOString() },
        );
        const entries = [entry, ...journal.entries];
        await persist(entries);
        setSelectedId(entry.id);
        setStatus("Log saved.");
      }
      resetComposer();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save this log.");
    }
  }

  function beginEdit(entry: JournalEntry) {
    setSelectedId(entry.id);
    setEditingId(entry.id);
    setBody(entry.body);
    setEventDate(new Date(entry.eventAt));
    setStatus("Editing saved log.");
  }

  function cancelEdit() {
    resetComposer();
    setStatus("Edit cancelled.");
  }

  function selectEntry(id: string) {
    setSelectedId(id);
    resetComposer();
    setStatus("Opened saved log.");
  }

  function handleDateChange(event: DateTimePickerEvent, date?: Date) {
    if (event.type !== "set" || !date) {
      if (Platform.OS !== "ios") setPickerMode(null);
      return;
    }

    if (Platform.OS === "android" && pickerMode === "date") {
      const next = new Date(eventDate);
      next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setEventDate(next);
      setPickerMode("time");
      return;
    }

    if (Platform.OS === "android" && pickerMode === "time") {
      const next = new Date(eventDate);
      next.setHours(date.getHours(), date.getMinutes(), 0, 0);
      setEventDate(next);
      setPickerMode(null);
      return;
    }

    setEventDate(date);
  }

  function confirmRecovery() {
    Alert.alert(
      "Start a fresh journal?",
      "The unreadable data will be kept in a backup, but your visible journal will start empty.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start fresh",
          style: "destructive",
          onPress: () => void handleRecovery(),
        },
      ],
    );
  }

  async function handleRecovery() {
    try {
      await recoverUnreadableStorage(new Date().toISOString());
      setJournal(blankSnapshot);
      setSelectedId(null);
      resetComposer();
      setStatus("A fresh journal is ready. The unreadable data was backed up.");
    } catch {
      setStatus("Could not recover the journal. Please try again.");
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator color={colors.sageDark} />
        <Text style={styles.loadingText}>Opening your journal…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.wordmark}>Foresight</Text>
            <Text style={styles.subhead}>A journal for your own words</Text>
          </View>
          <Pressable
            accessibilityLabel="Start a new log"
            onPress={() => {
              setSelectedId(null);
              resetComposer();
              setStatus("Ready for a new log.");
            }}
            style={({ pressed }) => [styles.newLogButton, pressed && styles.pressed]}
          >
            <Text style={styles.newLogButtonText}>New log</Text>
          </Pressable>
        </View>

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>Your own words</Text>
          <Text style={styles.title}>Log what happened.</Text>
          <Text style={styles.lede}>Nothing to categorize. Just write it down.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>{editingId ? "Editing log" : "New entry"}</Text>
          <Text style={styles.cardTitle}>{editingId ? "Make a correction" : "Write a log"}</Text>
          <Text style={styles.label}>What happened?</Text>
          <TextInput
            accessibilityLabel="What happened?"
            multiline
            maxLength={5000}
            onChangeText={setBody}
            placeholder="Write freely. Nothing needs to be categorized."
            placeholderTextColor={colors.placeholder}
            style={styles.textArea}
            textAlignVertical="top"
            value={body}
          />

          <Text style={styles.label}>When did it happen?</Text>
          <Pressable
            accessibilityHint="Opens the date and time picker"
            accessibilityLabel={`Event time: ${displayDate(eventDate.toISOString())}`}
            onPress={() => setPickerMode((mode) => (mode ? null : Platform.OS === "ios" ? "datetime" : "date"))}
            style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}
          >
            <Text style={styles.dateButtonText}>{displayDate(eventDate.toISOString())}</Text>
            <Text style={styles.dateButtonEdit}>Change</Text>
          </Pressable>
          {pickerMode && (
            <DateTimePicker
              display={Platform.OS === "ios" ? "inline" : "default"}
              mode={pickerMode}
              onChange={handleDateChange}
              value={eventDate}
            />
          )}

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={editingId ? "Update log" : "Save log"}
              accessibilityState={{ disabled: !body.trim() }}
              disabled={!body.trim()}
              onPress={() => void handleSave()}
              style={({ pressed }) => [
                styles.primaryButton,
                !body.trim() && styles.primaryButtonDisabled,
                pressed && body.trim() && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>{editingId ? "Update log" : "Save log"}</Text>
            </Pressable>
            {editingId && (
              <Pressable accessibilityLabel="Cancel editing" onPress={cancelEdit} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
            )}
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.eyebrow}>History</Text>
            <Text style={styles.cardTitle}>Your logs</Text>
          </View>
          <Text style={styles.count}>{journal.entries.length === 1 ? "1 entry" : `${journal.entries.length} entries`}</Text>
        </View>

        {journal.recoveryNeeded && (
          <View style={styles.warning}>
            <Text style={styles.warningText}>Some journal data could not be read.</Text>
            <Pressable accessibilityLabel="Start a fresh journal" onPress={confirmRecovery}>
              <Text style={styles.warningAction}>Start a fresh journal</Text>
            </Pressable>
          </View>
        )}

        {journal.entries.length === 0 ? (
          <View style={[styles.card, styles.emptyCard]}>
            <Text style={styles.emptyTitle}>No logs yet.</Text>
            <Text style={styles.emptyText}>Your next note will appear here.</Text>
          </View>
        ) : (
          <View style={styles.history}>
            {journal.entries.map((entry) => (
              <Pressable
                accessibilityLabel={`Open log from ${displayDate(entry.eventAt, false)}`}
                accessibilityState={{ selected: entry.id === selectedId }}
                key={entry.id}
                onPress={() => selectEntry(entry.id)}
                style={({ pressed }) => [
                  styles.historyItem,
                  entry.id === selectedId && styles.historyItemSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.historyDate}>{displayDate(entry.eventAt, false)}</Text>
                <Text numberOfLines={2} style={styles.historyPreview}>{entry.body}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {selectedEntry && (
          <View style={[styles.card, styles.detailCard]}>
            <Text style={styles.eyebrow}>Saved log</Text>
            <Text style={styles.cardTitle}>{displayDate(selectedEntry.eventAt)}</Text>
            <Text style={styles.detailBody}>{selectedEntry.body}</Text>
            <Text style={styles.meta}>
              Created {displayDate(selectedEntry.createdAt)}{`\n`}Updated {displayDate(selectedEntry.updatedAt)}
            </Text>
            <Pressable accessibilityLabel="Edit selected log" onPress={() => beginEdit(selectedEntry)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Edit log</Text>
            </Pressable>
          </View>
        )}

        {journal.ignoredEntries > 0 && (
          <Text style={styles.mutedNotice}>
            {journal.ignoredEntries === 1 ? "One malformed saved log was hidden." : `${journal.ignoredEntries} malformed saved logs were hidden.`}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  canvas: "#F5F4EF",
  surface: "#FFFEFA",
  ink: "#20231F",
  muted: "#667067",
  line: "#D9DDD5",
  sage: "#55715F",
  sageDark: "#34503F",
  warm: "#F0EDE2",
  placeholder: "#8A918A",
  warning: "#714F20",
  warningBackground: "#FAF2DF",
};

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas, flex: 1 },
  loadingScreen: { alignItems: "center", backgroundColor: colors.canvas, flex: 1, gap: 12, justifyContent: "center" },
  loadingText: { color: colors.muted, fontSize: 15 },
  content: { gap: 20, padding: 20, paddingBottom: 56 },
  header: { alignItems: "center", borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingBottom: 18 },
  wordmark: { color: colors.ink, fontFamily: Platform.select({ ios: "Georgia", android: "serif" }), fontSize: 25, fontWeight: "700" },
  subhead: { color: colors.muted, fontSize: 13, marginTop: 2 },
  newLogButton: { borderColor: colors.line, borderRadius: 100, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  newLogButtonText: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  intro: { gap: 7, paddingBottom: 6, paddingTop: 24 },
  eyebrow: { color: colors.sageDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.35, textTransform: "uppercase" },
  title: { color: colors.ink, fontFamily: Platform.select({ ios: "Georgia", android: "serif" }), fontSize: 44, letterSpacing: -1.6, lineHeight: 48 },
  lede: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 12, padding: 20 },
  cardTitle: { color: colors.ink, fontFamily: Platform.select({ ios: "Georgia", android: "serif" }), fontSize: 25, letterSpacing: -0.45, lineHeight: 30 },
  label: { color: colors.ink, fontSize: 14, fontWeight: "700", marginTop: 8 },
  textArea: { backgroundColor: "#FFFFFF", borderColor: "#BFC8BF", borderRadius: 11, borderWidth: 1, color: colors.ink, fontSize: 16, lineHeight: 24, minHeight: 150, padding: 14 },
  dateButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#BFC8BF", borderRadius: 11, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 13 },
  dateButtonText: { color: colors.ink, fontSize: 15 },
  dateButtonEdit: { color: colors.sageDark, fontSize: 14, fontWeight: "800" },
  actions: { alignItems: "center", flexDirection: "row", gap: 10, marginTop: 8 },
  primaryButton: { alignItems: "center", backgroundColor: colors.sageDark, borderRadius: 100, justifyContent: "center", minHeight: 45, paddingHorizontal: 18 },
  primaryButtonDisabled: { backgroundColor: "#9CA89D" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  secondaryButton: { alignItems: "center", alignSelf: "flex-start", borderColor: colors.line, borderRadius: 100, borderWidth: 1, minHeight: 42, justifyContent: "center", paddingHorizontal: 16 },
  secondaryButtonText: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  status: { color: colors.sageDark, fontSize: 13, lineHeight: 18, minHeight: 18 },
  sectionHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  count: { color: colors.muted, fontSize: 13, paddingBottom: 3 },
  warning: { backgroundColor: colors.warningBackground, borderColor: "#E5C887", borderRadius: 11, borderWidth: 1, gap: 6, padding: 14 },
  warningText: { color: colors.warning, fontSize: 14, lineHeight: 20 },
  warningAction: { color: colors.warning, fontSize: 14, fontWeight: "800", textDecorationLine: "underline" },
  emptyCard: { alignItems: "center", justifyContent: "center", minHeight: 160 },
  emptyTitle: { color: colors.ink, fontFamily: Platform.select({ ios: "Georgia", android: "serif" }), fontSize: 22 },
  emptyText: { color: colors.muted, fontSize: 14 },
  history: { gap: 8 },
  historyItem: { backgroundColor: colors.surface, borderColor: "transparent", borderRadius: 13, borderWidth: 1, gap: 5, padding: 15 },
  historyItemSelected: { backgroundColor: "#E8EEE7", borderColor: "#B9CAB9" },
  historyDate: { color: colors.sageDark, fontSize: 12, fontWeight: "800" },
  historyPreview: { color: colors.ink, fontSize: 16, lineHeight: 22 },
  detailCard: { marginTop: 2 },
  detailBody: { color: colors.ink, fontFamily: Platform.select({ ios: "Georgia", android: "serif" }), fontSize: 20, lineHeight: 31, marginTop: 5 },
  meta: { borderTopColor: colors.line, borderTopWidth: 1, color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6, paddingTop: 14 },
  mutedNotice: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  pressed: { opacity: 0.7 },
});
