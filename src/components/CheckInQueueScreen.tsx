import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { delayedCheckInQueue } from "../check-in-queue";
import { formatLogDateTime } from "../journal-format";
import { JournalSnapshot, OutcomeCheckIn } from "../journal-storage";

export function CheckInQueueScreen({ journal, now, status, onAnswer, onReschedule, onSkip }: {
  journal: JournalSnapshot;
  now: Date;
  status: string;
  onAnswer: (checkIn: OutcomeCheckIn) => void;
  onReschedule: (checkIn: OutcomeCheckIn) => void;
  onSkip: (checkIn: OutcomeCheckIn) => void;
}) {
  const queued = delayedCheckInQueue(journal, now);
  const due = queued.filter((item) => item.due);
  const upcoming = queued.filter((item) => !item.due);
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.intro}><Text style={styles.title}>Check in</Text><Text style={styles.subtitle}>Reflect when you are ready. Skipping a prompt never changes your log.</Text></View>{status ? <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text> : null}{due.length === 0 && upcoming.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Nothing waiting</Text><Text style={styles.emptyText}>Schedule a later reflection from any saved log when you want to revisit how it affected you.</Text></View> : null}{due.length > 0 ? <QueueGroup title="Ready to reflect" items={due} onAnswer={onAnswer} onReschedule={onReschedule} onSkip={onSkip} /> : null}{upcoming.length > 0 ? <QueueGroup title="Scheduled for later" items={upcoming} onAnswer={onAnswer} onReschedule={onReschedule} onSkip={onSkip} /> : null}</ScrollView>;
}

function QueueGroup({ title, items, onAnswer, onReschedule, onSkip }: { title: string; items: ReturnType<typeof delayedCheckInQueue>; onAnswer: (checkIn: OutcomeCheckIn) => void; onReschedule: (checkIn: OutcomeCheckIn) => void; onSkip: (checkIn: OutcomeCheckIn) => void }) {
  return <View style={styles.group}><Text style={styles.eyebrow}>{title}</Text>{items.map(({ checkIn, entry, due, overdue }) => <View key={checkIn.id} style={styles.card}><Text style={styles.due}>{overdue ? `Overdue since ${formatLogDateTime(checkIn.dueAt!)}` : due ? "Ready now" : `Due ${formatLogDateTime(checkIn.dueAt!)}`}</Text><Text numberOfLines={3} style={styles.body}>{entry.body}</Text><View style={styles.actions}>{due ? <Pressable accessibilityLabel="Answer delayed check-in" onPress={() => onAnswer(checkIn)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Reflect</Text></Pressable> : null}<Pressable accessibilityLabel="Reschedule delayed check-in" onPress={() => onReschedule(checkIn)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Reschedule</Text></Pressable><Pressable accessibilityLabel="Skip delayed check-in" onPress={() => onSkip(checkIn)} style={styles.skipButton}><Text style={styles.skipText}>Skip</Text></Pressable></View></View>)}</View>;
}

const colors = { surface: "#FFFEFA", ink: "#20231F", muted: "#667067", line: "#D9DDD5", sageDark: "#34503F" };
const styles = StyleSheet.create({ content: { gap: 18, padding: 20, paddingBottom: 56 }, intro: { gap: 8, paddingTop: 12 }, title: { color: colors.ink, fontFamily: "Georgia", fontSize: 44, letterSpacing: -1.6, lineHeight: 48 }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 }, status: { color: colors.sageDark, fontSize: 13, lineHeight: 18 }, eyebrow: { color: colors.sageDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.35, textTransform: "uppercase" }, group: { gap: 10 }, card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 10, padding: 18 }, due: { color: colors.sageDark, fontSize: 13, fontWeight: "800" }, body: { color: colors.ink, fontFamily: "Georgia", fontSize: 17, lineHeight: 25 }, actions: { alignItems: "center", flexDirection: "row", gap: 8, flexWrap: "wrap" }, primaryButton: { alignItems: "center", backgroundColor: colors.sageDark, borderRadius: 100, justifyContent: "center", minHeight: 40, paddingHorizontal: 15 }, primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, secondaryButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#BFC8BF", borderRadius: 100, borderWidth: 1, justifyContent: "center", minHeight: 40, paddingHorizontal: 14 }, secondaryButtonText: { color: colors.sageDark, fontSize: 14, fontWeight: "800" }, skipButton: { paddingHorizontal: 5, paddingVertical: 8 }, skipText: { color: "#714F20", fontSize: 14, fontWeight: "800" }, emptyCard: { alignItems: "center", backgroundColor: "#EDEFE9", borderRadius: 18, gap: 8, minHeight: 170, justifyContent: "center", padding: 24 }, emptyTitle: { color: colors.ink, fontFamily: "Georgia", fontSize: 24 }, emptyText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" } });
