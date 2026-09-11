import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatLogDateTime } from "../journal-format";
import { formatOutcomeSummary } from "../outcome-format";
import { JournalEntry, JournalSnapshot, OutcomeCheckIn } from "../journal-storage";

export function LogDetailScreen({ entry, journal, immediateCheckIn, delayedCheckIn, status, onBack, onEdit, onCheckIn, onScheduleCheckIn, onRescheduleCheckIn, onRemoveCheckIn, onRemoveDelayedCheckIn }: {
  entry: JournalEntry;
  journal: JournalSnapshot;
  immediateCheckIn: OutcomeCheckIn | null;
  delayedCheckIn: OutcomeCheckIn | null;
  status: string;
  onBack: () => void;
  onEdit: () => void;
  onCheckIn: () => void;
  onScheduleCheckIn: () => void;
  onRescheduleCheckIn: () => void;
  onRemoveCheckIn: () => void;
  onRemoveDelayedCheckIn: () => void;
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
    <View style={styles.outcomeCard}>
      <Text style={styles.eyebrow}>Overall feeling</Text>
      {immediateCheckIn ? <>
        <Text style={styles.outcomeTitle}>{formatOutcomeSummary(immediateCheckIn)}</Text>
        {immediateCheckIn.note ? <Text style={styles.outcomeNote}>{immediateCheckIn.note}</Text> : null}
        <View style={styles.outcomeActions}>
          <Pressable accessibilityLabel="Update overall feeling" onPress={onCheckIn} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Update feeling</Text></Pressable>
          <Pressable accessibilityLabel="Remove overall feeling" onPress={onRemoveCheckIn} style={styles.removeButton}><Text style={styles.removeButtonText}>Remove</Text></Pressable>
        </View>
      </> : <>
        <Text style={styles.outcomeTitle}>No reflection yet</Text>
        <Text style={styles.outcomeText}>Take a moment to notice how this left you feeling.</Text>
        <Pressable accessibilityLabel="Check in on overall feeling" onPress={onCheckIn} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Check in now</Text></Pressable>
      </>}
    </View>
    <View style={styles.followUpCard}>
      <Text style={styles.eyebrow}>Later reflection</Text>
      {delayedCheckIn ? <>
        <Text style={styles.outcomeTitle}>Scheduled</Text>
        <Text style={styles.outcomeText}>Due {formatLogDateTime(delayedCheckIn.dueAt!)}</Text>
        <View style={styles.outcomeActions}><Pressable accessibilityLabel="Reschedule later reflection" onPress={onRescheduleCheckIn} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Reschedule</Text></Pressable><Pressable accessibilityLabel="Cancel later reflection" onPress={onRemoveDelayedCheckIn} style={styles.removeButton}><Text style={styles.removeButtonText}>Cancel</Text></Pressable></View>
      </> : <>
        <Text style={styles.outcomeTitle}>Reflect later</Text>
        <Text style={styles.outcomeText}>Schedule a private follow-up for when the effect is clearer.</Text>
        <Pressable accessibilityLabel="Schedule a later reflection" onPress={onScheduleCheckIn} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Check in later</Text></Pressable>
      </>}
    </View>
  </ScrollView>;
}

const colors = { surface: "#FFFEFA", ink: "#20231F", muted: "#667067", line: "#D9DDD5", sageDark: "#34503F" };
const styles = StyleSheet.create({
  content: { gap: 18, padding: 20, paddingBottom: 56 }, header: { gap: 14 }, backButton: { alignSelf: "flex-start", paddingVertical: 6 }, backText: { color: colors.sageDark, fontSize: 15, fontWeight: "800" }, eyebrow: { color: colors.sageDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.35, textTransform: "uppercase" }, status: { color: colors.sageDark, fontSize: 13, lineHeight: 18 }, card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 16, padding: 20 }, date: { color: colors.sageDark, fontFamily: "Georgia", fontSize: 23, lineHeight: 30 }, body: { color: colors.ink, fontFamily: "Georgia", fontSize: 21, lineHeight: 32 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { backgroundColor: "#E8EEE7", borderRadius: 100, paddingHorizontal: 12, paddingVertical: 8 }, chipText: { color: colors.sageDark, fontSize: 13, fontWeight: "800" }, meta: { borderTopColor: colors.line, borderTopWidth: 1, color: colors.muted, fontSize: 12, lineHeight: 18, paddingTop: 14 }, editButton: { alignItems: "center", backgroundColor: colors.sageDark, borderRadius: 100, minHeight: 46, justifyContent: "center", paddingHorizontal: 18 }, editButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, outcomeCard: { backgroundColor: "#EDEFE9", borderRadius: 18, gap: 10, padding: 20 }, followUpCard: { backgroundColor: "#F2F0E9", borderRadius: 18, gap: 10, padding: 20 }, outcomeTitle: { color: colors.ink, fontFamily: "Georgia", fontSize: 24, lineHeight: 30 }, outcomeText: { color: colors.muted, fontSize: 14, lineHeight: 20 }, outcomeNote: { color: colors.ink, fontSize: 15, fontStyle: "italic", lineHeight: 22 }, outcomeActions: { flexDirection: "row", gap: 12 }, secondaryButton: { alignItems: "center", backgroundColor: colors.surface, borderColor: "#BFC8BF", borderRadius: 100, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 43, paddingHorizontal: 14 }, secondaryButtonText: { color: colors.sageDark, fontSize: 14, fontWeight: "800" }, removeButton: { alignItems: "center", justifyContent: "center", paddingHorizontal: 8 }, removeButtonText: { color: "#714F20", fontSize: 14, fontWeight: "800" },
});
