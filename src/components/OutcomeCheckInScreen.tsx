import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { formatLogDateTime } from "../journal-format";
import { OutcomeCheckIn, OutcomeValue } from "../journal-storage";

const choices: { value: OutcomeValue; label: string }[] = [
  { value: -2, label: "Much worse" },
  { value: -1, label: "A little worse" },
  { value: 0, label: "About the same" },
  { value: 1, label: "A little better" },
  { value: 2, label: "Much better" },
];

export function OutcomeCheckInScreen({ body, eventAt, checkIn, note, status, onNoteChange, onRespond, onBack }: {
  body: string;
  eventAt: string;
  checkIn: OutcomeCheckIn | null;
  note: string;
  status: string;
  onNoteChange: (note: string) => void;
  onRespond: (response: { status: "answered"; overall: OutcomeValue } | { status: "not_sure" }) => void;
  onBack: () => void;
}) {
  const actionVerb = checkIn ? "Update" : "Save";
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}>
      <Pressable accessibilityLabel="Back to log" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹ Log</Text></Pressable>
      <Text style={styles.eyebrow}>{checkIn ? "Update reflection" : "Check in"}</Text>
      <Text style={styles.title}>How do you feel now?</Text>
      <Text style={styles.intro}>Compared with before this log, how do you feel overall?</Text>
    </View>
    <View style={styles.logCard}>
      <Text style={styles.logDate}>{formatLogDateTime(eventAt)}</Text>
      <Text numberOfLines={4} style={styles.logBody}>{body}</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.label}>Choose one</Text>
      <View style={styles.choices}>{choices.map((choice) => <Pressable key={choice.value} accessibilityLabel={`${actionVerb} ${choice.label.toLowerCase()}`} onPress={() => onRespond({ status: "answered", overall: choice.value })} style={styles.choice}><Text style={styles.choiceText}>{choice.label}</Text></Pressable>)}</View>
      <Pressable accessibilityLabel={`${actionVerb} not sure or too soon to tell`} onPress={() => onRespond({ status: "not_sure" })} style={styles.notSure}><Text style={styles.notSureText}>Not sure / too soon to tell</Text></Pressable>
      <Text style={styles.label}>A note, if helpful</Text>
      <TextInput accessibilityLabel="Reflection note" maxLength={5000} multiline onChangeText={onNoteChange} placeholder="What made it feel that way?" placeholderTextColor={colors.placeholder} style={styles.note} textAlignVertical="top" value={note} />
      {status ? <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text> : null}
    </View>
  </ScrollView>;
}

const colors = { surface: "#FFFEFA", ink: "#20231F", muted: "#667067", line: "#D9DDD5", sageDark: "#34503F", placeholder: "#8A918A" };
const styles = StyleSheet.create({
  content: { gap: 18, padding: 20, paddingBottom: 56 }, header: { gap: 9, paddingTop: 4 }, backButton: { alignSelf: "flex-start", paddingVertical: 6 }, backText: { color: colors.sageDark, fontSize: 15, fontWeight: "800" }, eyebrow: { color: colors.sageDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.35, textTransform: "uppercase" }, title: { color: colors.ink, fontFamily: "Georgia", fontSize: 35, letterSpacing: -1, lineHeight: 42 }, intro: { color: colors.muted, fontSize: 15, lineHeight: 22 }, logCard: { backgroundColor: "#EDEFE9", borderRadius: 15, gap: 8, padding: 16 }, logDate: { color: colors.sageDark, fontSize: 13, fontWeight: "800" }, logBody: { color: colors.ink, fontFamily: "Georgia", fontSize: 16, lineHeight: 24 }, card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 12, padding: 20 }, label: { color: colors.ink, fontSize: 14, fontWeight: "800" }, choices: { gap: 8 }, choice: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#BFC8BF", borderRadius: 12, borderWidth: 1, minHeight: 48, justifyContent: "center", paddingHorizontal: 16 }, choiceText: { color: colors.ink, fontSize: 15, fontWeight: "800" }, notSure: { alignItems: "center", paddingVertical: 8 }, notSureText: { color: colors.sageDark, fontSize: 14, fontWeight: "800", textDecorationLine: "underline" }, note: { backgroundColor: "#FFFFFF", borderColor: "#BFC8BF", borderRadius: 11, borderWidth: 1, color: colors.ink, fontSize: 16, lineHeight: 23, minHeight: 100, padding: 14 }, status: { color: colors.sageDark, fontSize: 13, lineHeight: 18 },
});
