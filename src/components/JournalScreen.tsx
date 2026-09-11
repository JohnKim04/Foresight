import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatLogAccessibilityDateTime, formatLogListDate } from "../journal-format";
import { filterEntriesByCategory, JournalSnapshot } from "../journal-storage";

type JournalScreenProps = {
  journal: JournalSnapshot;
  historyCategoryId: string | null;
  status: string;
  onNewLog: () => void;
  onHistoryFilterChange: (id: string | null) => void;
  onOpenEntry: (id: string) => void;
  onRecoveryRequest: () => void;
};

function categoryNames(categoryIds: string[], journal: JournalSnapshot): string {
  const names = new Map(journal.categories.map((category) => [category.id, category.name]));
  return categoryIds.map((id) => names.get(id)).filter((name): name is string => Boolean(name)).join(" · ");
}

export function JournalScreen(props: JournalScreenProps) {
  const entries = filterEntriesByCategory(props.journal.entries, props.historyCategoryId);
  return <>
    <View style={styles.intro}><Text style={styles.title}>Write about anything.</Text></View>
    <Pressable accessibilityLabel="Start a new log" onPress={props.onNewLog} style={styles.newLogButton}><Text style={styles.newLogButtonText}>New log</Text></Pressable>
    {props.status ? <Text accessibilityLiveRegion="polite" style={styles.status}>{props.status}</Text> : null}
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent logs</Text><Text style={styles.count}>{entries.length === 1 ? "1 entry" : `${entries.length} entries`}</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}><Pressable onPress={() => props.onHistoryFilterChange(null)} style={[styles.filter, !props.historyCategoryId && styles.filterSelected]}><Text style={[styles.filterText, !props.historyCategoryId && styles.filterTextSelected]}>All logs</Text></Pressable>{props.journal.categories.map((category) => <Pressable key={category.id} onPress={() => props.onHistoryFilterChange(category.id)} style={[styles.filter, props.historyCategoryId === category.id && styles.filterSelected]}><Text style={[styles.filterText, props.historyCategoryId === category.id && styles.filterTextSelected]}>{category.name}{category.archivedAt ? " (archived)" : ""}</Text></Pressable>)}</ScrollView>
    {props.journal.recoveryNeeded && <View style={styles.warning}><Text style={styles.warningText}>Some journal data could not be read.</Text><Pressable accessibilityLabel="Start a fresh journal" onPress={props.onRecoveryRequest}><Text style={styles.warningAction}>Start a fresh journal</Text></Pressable></View>}
    {entries.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyTitle}>{props.historyCategoryId ? "No matching logs." : "No logs yet."}</Text><Text style={styles.emptyText}>{props.historyCategoryId ? "Try another category or write a new log." : "Your next note will appear here."}</Text></View> : <View style={styles.history}>{entries.map((entry) => <Pressable accessibilityLabel={`Open log from ${formatLogAccessibilityDateTime(entry.eventAt)}`} key={entry.id} onPress={() => props.onOpenEntry(entry.id)} style={styles.historyItem}><Text style={styles.historyDate}>{formatLogListDate(entry.eventAt)}</Text><Text numberOfLines={2} style={styles.historyPreview}>{entry.body}</Text>{entry.categoryIds.length > 0 && <Text style={styles.historyCategories}>{categoryNames(entry.categoryIds, props.journal)}</Text>}</Pressable>)}</View>}
    {props.journal.ignoredEntries > 0 && <Text style={styles.mutedNotice}>{props.journal.ignoredEntries === 1 ? "One malformed saved item was hidden." : `${props.journal.ignoredEntries} malformed saved items were hidden.`}</Text>}
  </>;
}

const colors = { surface: "#FFFEFA", ink: "#20231F", muted: "#667067", line: "#D9DDD5", sageDark: "#34503F", warning: "#714F20", warningBackground: "#FAF2DF" };
const styles = StyleSheet.create({
  intro: { paddingBottom: 2, paddingTop: 12 }, title: { color: colors.ink, fontFamily: "Georgia", fontSize: 39, letterSpacing: -1.25, lineHeight: 46 }, newLogButton: { alignItems: "center", backgroundColor: colors.sageDark, borderRadius: 14, justifyContent: "center", minHeight: 54 }, newLogButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, status: { color: colors.sageDark, fontSize: 13, lineHeight: 18 }, sectionHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginTop: 8 }, sectionTitle: { color: colors.ink, fontFamily: "Georgia", fontSize: 25, letterSpacing: -0.45, lineHeight: 30 }, count: { color: colors.muted, fontSize: 13 }, filterRow: { gap: 8 }, filter: { borderColor: colors.line, borderRadius: 100, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 }, filterSelected: { backgroundColor: colors.sageDark, borderColor: colors.sageDark }, filterText: { color: colors.ink, fontSize: 13, fontWeight: "700" }, filterTextSelected: { color: "#FFFFFF" }, warning: { backgroundColor: colors.warningBackground, borderColor: "#E5C887", borderRadius: 11, borderWidth: 1, gap: 6, padding: 14 }, warningText: { color: colors.warning, fontSize: 14, lineHeight: 20 }, warningAction: { color: colors.warning, fontSize: 14, fontWeight: "800", textDecorationLine: "underline" }, emptyCard: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 18, borderWidth: 1, justifyContent: "center", minHeight: 160, padding: 20 }, emptyTitle: { color: colors.ink, fontFamily: "Georgia", fontSize: 22 }, emptyText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" }, history: { gap: 8 }, historyItem: { backgroundColor: colors.surface, borderRadius: 13, gap: 5, padding: 15 }, historyDate: { color: colors.sageDark, fontSize: 12, fontWeight: "800" }, historyPreview: { color: colors.ink, fontSize: 16, lineHeight: 22 }, historyCategories: { color: colors.muted, fontSize: 12, fontWeight: "700" }, mutedNotice: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
});
