import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatLogDateTime } from "../journal-format";
import { JournalEntry, JournalSnapshot } from "../journal-storage";

export function LogDetailScreen({ entry, journal, status, onBack, onEdit }: {
  entry: JournalEntry;
  journal: JournalSnapshot;
  status: string;
  onBack: () => void;
  onEdit: () => void;
}) {
  const categories = new Map(journal.categories.map((category) => [category.id, category]));
  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable accessibilityLabel="Back to journal" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹ Journal</Text></Pressable><Text style={styles.eyebrow}>Saved log</Text></View>
    {status ? <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text> : null}
    <View style={styles.card}>
      <Text style={styles.date}>{formatLogDateTime(entry.eventAt)}</Text>
      {entry.categoryIds.length > 0 && <View style={styles.chips}>{entry.categoryIds.map((id) => { const category = categories.get(id); return category ? <View key={id} style={styles.chip}><Text style={styles.chipText}>{category.name}{category.archivedAt ? " (archived)" : ""}</Text></View> : null; })}</View>}
      <Text style={styles.body}>{entry.body}</Text>
      <Text style={styles.meta}>Created {formatLogDateTime(entry.createdAt)}{"\n"}Updated {formatLogDateTime(entry.updatedAt)}</Text>
      <Pressable accessibilityLabel="Edit log" onPress={onEdit} style={styles.editButton}><Text style={styles.editButtonText}>Edit log</Text></Pressable>
    </View>
  </ScrollView>;
}

const colors = { surface: "#FFFEFA", ink: "#20231F", muted: "#667067", line: "#D9DDD5", sageDark: "#34503F" };
const styles = StyleSheet.create({
  content: { gap: 18, padding: 20, paddingBottom: 56 }, header: { gap: 14 }, backButton: { alignSelf: "flex-start", paddingVertical: 6 }, backText: { color: colors.sageDark, fontSize: 15, fontWeight: "800" }, eyebrow: { color: colors.sageDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.35, textTransform: "uppercase" }, status: { color: colors.sageDark, fontSize: 13, lineHeight: 18 }, card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 16, padding: 20 }, date: { color: colors.sageDark, fontFamily: "Georgia", fontSize: 23, lineHeight: 30 }, body: { color: colors.ink, fontFamily: "Georgia", fontSize: 21, lineHeight: 32 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { backgroundColor: "#E8EEE7", borderRadius: 100, paddingHorizontal: 12, paddingVertical: 8 }, chipText: { color: colors.sageDark, fontSize: 13, fontWeight: "800" }, meta: { borderTopColor: colors.line, borderTopWidth: 1, color: colors.muted, fontSize: 12, lineHeight: 18, paddingTop: 14 }, editButton: { alignItems: "center", backgroundColor: colors.sageDark, borderRadius: 100, minHeight: 46, justifyContent: "center", paddingHorizontal: 18 }, editButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
