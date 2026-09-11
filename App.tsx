import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { TrendRange } from "./src/category-trends";
import { JournalScreen } from "./src/components/JournalScreen";
import { LogComposerScreen, PickerMode } from "./src/components/LogComposerScreen";
import { LogDetailScreen } from "./src/components/LogDetailScreen";
import { ScreenTabs } from "./src/components/ScreenTabs";
import { TrendsScreen } from "./src/components/TrendsScreen";
import { createJournalController } from "./src/journal-controller";
import { JournalRoute, journalRoute, leaveFocusedRoute, openDetail, openEditComposer, openNewComposer, resolveRoute, routeAfterSave, topLevelRoute } from "./src/journal-navigation";
import { defaultCategories, JournalCategory, JournalEntry, JournalSnapshot, JOURNAL_VERSION } from "./src/journal-storage";

const blankSnapshot: JournalSnapshot = { version: JOURNAL_VERSION, entries: [], categories: defaultCategories(), recoveryNeeded: false, ignoredEntries: 0 };

function makeId(prefix: "entry" | "category"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const controller = useMemo(() => createJournalController({ storage: AsyncStorage, now: () => new Date(), createId: makeId }), []);
  const [journal, setJournal] = useState<JournalSnapshot>(blankSnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [route, setRoute] = useState<JournalRoute>(journalRoute);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date());
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [historyCategoryId, setHistoryCategoryId] = useState<string | null>(null);
  const [trendRange, setTrendRange] = useState<TrendRange>(7);
  const [trendCategoryId, setTrendCategoryId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [status, setStatus] = useState("");

  const resetComposer = useCallback(() => {
    setEditingId(null);
    setBody("");
    setEventDate(new Date());
    setCategoryIds([]);
    setNewCategoryName("");
    setPickerMode(null);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        setJournal(await controller.load());
      } catch {
        setStatus("Your journal could not be opened. Please try again.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [controller]);

  useEffect(() => {
    const nextRoute = resolveRoute(route, new Set(journal.entries.map((entry) => entry.id)));
    if (nextRoute !== route) {
      setRoute(nextRoute);
      setStatus("That log is no longer available.");
    }
  }, [journal.entries, route]);

  function cancelComposer() {
    setRoute(leaveFocusedRoute(route));
    resetComposer();
    setStatus("");
  }

  function closeDetail() {
    setRoute(journalRoute);
    setStatus("");
  }

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (route.screen === "detail") {
        closeDetail();
        return true;
      }
      if (route.screen === "composer") {
        cancelComposer();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [route]);

  function openComposerForNewLog() {
    resetComposer();
    setStatus("");
    setRoute(openNewComposer());
  }

  function openComposerForEdit(entry: JournalEntry) {
    setEditingId(entry.id);
    setBody(entry.body);
    setEventDate(new Date(entry.eventAt));
    setCategoryIds(entry.categoryIds);
    setNewCategoryName("");
    setPickerMode(null);
    setStatus("");
    setRoute(openEditComposer(entry.id));
  }

  async function handleSave() {
    if (!body.trim()) return;
    try {
      const next = await controller.saveLog(journal, { id: editingId ?? undefined, body, eventAt: eventDate.toISOString(), categoryIds });
      const savedId = editingId ?? next.entries.find((entry) => !journal.entries.some((existing) => existing.id === entry.id))?.id;
      if (!savedId) throw new Error("Could not find the saved log.");
      setJournal(next);
      resetComposer();
      setRoute(routeAfterSave(savedId));
      setStatus(editingId ? "Log updated." : "Log saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save this log.");
    }
  }

  async function handleCreateCategory() {
    try {
      const result = await controller.addCategory(journal, newCategoryName);
      setJournal(result.journal);
      setCategoryIds((current) => [...current, result.category.id]);
      setNewCategoryName("");
      setStatus(`${result.category.name} added to this log.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create this category.");
    }
  }

  async function handleArchiveCategory(id: string) {
    try {
      setJournal(await controller.archiveCategory(journal, id));
      setCategoryIds((current) => current.filter((categoryId) => categoryId !== id));
      setStatus("Category archived. Existing logs were kept.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not archive this category.");
    }
  }

  function confirmArchive(category: JournalCategory) {
    Alert.alert(`Archive ${category.name}?`, "It will stay on past logs and in Trends, but cannot be selected for new logs.", [
      { text: "Cancel", style: "cancel" },
      { text: "Archive", style: "destructive", onPress: () => void handleArchiveCategory(category.id) },
    ]);
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
    Alert.alert("Start a fresh journal?", "The unreadable data will be kept in a backup, but your visible journal will start empty.", [
      { text: "Cancel", style: "cancel" },
      { text: "Start fresh", style: "destructive", onPress: () => void handleRecovery() },
    ]);
  }

  async function handleRecovery() {
    try {
      setJournal(await controller.recover());
      resetComposer();
      setRoute(journalRoute);
      setStatus("A fresh journal is ready. The unreadable data was backed up.");
    } catch {
      setStatus("Could not recover the journal. Please try again.");
    }
  }

  const detailEntry = route.screen === "detail" ? journal.entries.find((entry) => entry.id === route.entryId) : null;

  if (isLoading) return <SafeAreaProvider><SafeAreaView style={styles.loadingScreen}><StatusBar style="dark" /><ActivityIndicator color={colors.sageDark} /><Text style={styles.loadingText}>Opening your journal…</Text></SafeAreaView></SafeAreaProvider>;

  let content: ReactNode;
  if (route.screen === "detail" && detailEntry) {
    content = <LogDetailScreen entry={detailEntry} journal={journal} status={status} onBack={closeDetail} onEdit={() => openComposerForEdit(detailEntry)} />;
  } else if (route.screen === "composer") {
    content = <LogComposerScreen journal={journal} mode={route.mode} body={body} eventDate={eventDate} categoryIds={categoryIds} newCategoryName={newCategoryName} pickerMode={pickerMode} status={status} onBodyChange={setBody} onPickerModeChange={setPickerMode} onDateChange={handleDateChange} onCategoryToggle={(id) => setCategoryIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} onNewCategoryNameChange={setNewCategoryName} onCreateCategory={() => void handleCreateCategory()} onArchiveRequest={confirmArchive} onSave={() => void handleSave()} onCancel={cancelComposer} />;
  } else {
    const topLevel = route.screen === "trends" ? "trends" : "journal";
    content = <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><Text style={styles.wordmark}>Foresight</Text></View>
      <ScreenTabs screen={topLevel} onChange={(screen) => { setRoute(topLevelRoute(screen)); setStatus(""); }} />
      {topLevel === "journal" ? <JournalScreen journal={journal} historyCategoryId={historyCategoryId} status={status} onNewLog={openComposerForNewLog} onHistoryFilterChange={setHistoryCategoryId} onOpenEntry={(id) => { setStatus(""); setRoute(openDetail(id)); }} onRecoveryRequest={confirmRecovery} /> : <TrendsScreen journal={journal} range={trendRange} selectedCategoryId={trendCategoryId} onRangeChange={setTrendRange} onCategoryChange={setTrendCategoryId} />}
    </ScrollView>;
  }

  return <SafeAreaProvider><SafeAreaView style={styles.screen}><StatusBar style="dark" />{content}</SafeAreaView></SafeAreaProvider>;
}

const colors = { canvas: "#F5F4EF", ink: "#20231F", muted: "#667067", line: "#D9DDD5", sageDark: "#34503F" };
const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas, flex: 1 }, loadingScreen: { alignItems: "center", backgroundColor: colors.canvas, flex: 1, gap: 12, justifyContent: "center" }, loadingText: { color: colors.muted, fontSize: 15 }, content: { gap: 20, padding: 20, paddingBottom: 56 }, header: { borderBottomColor: colors.line, borderBottomWidth: 1, paddingBottom: 18 }, wordmark: { color: colors.ink, fontFamily: Platform.select({ ios: "Georgia", android: "serif" }), fontSize: 25, fontWeight: "700" },
});
