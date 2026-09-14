import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { formatLogDateTime } from "../journal-format";
import { OutcomeCheckIn, OutcomeValue } from "../journal-storage";

export type OutcomeResponse = { status: "answered"; overall: OutcomeValue } | { status: "not_sure" };

const choices: { value: OutcomeValue; label: string; shortLabel: string }[] = [
  { value: -2, label: "Much worse", shortLabel: "−2" },
  { value: -1, label: "A little worse", shortLabel: "−1" },
  { value: 0, label: "About the same", shortLabel: "0" },
  { value: 1, label: "A little better", shortLabel: "+1" },
  { value: 2, label: "Much better", shortLabel: "+2" },
];

export function OutcomeCheckInScreen({ body, eventAt, checkIn, note, response, status, onNoteChange, onResponseChange, onSave, onBack }: {
  body: string;
  eventAt: string;
  checkIn: OutcomeCheckIn | null;
  note: string;
  response: OutcomeResponse | null;
  status: string;
  onNoteChange: (note: string) => void;
  onResponseChange: (response: OutcomeResponse) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  const isDelayed = checkIn?.phase === "delayed";
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}>
      <Pressable accessibilityLabel="Back to log" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹ Log</Text></Pressable>
      <Text style={styles.eyebrow}>{checkIn ? "Update check-in" : "Check in"}</Text>
      <Text style={styles.title}>Overall feeling</Text>
      <Text style={styles.intro}>{isDelayed ? "Since this log." : "Compared with before this log."}</Text>
    </View>
    <View style={styles.logCard}>
      <Text style={styles.logDate}>{formatLogDateTime(eventAt)}</Text>
      <Text numberOfLines={4} style={styles.logBody}>{body}</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.label}>Rating</Text>
      <View style={styles.scaleLabels}><Text style={styles.scaleLabel}>Worse</Text><Text style={styles.scaleLabel}>Better</Text></View>
      <View style={styles.choices}>{choices.map((choice) => <Pressable key={choice.value} accessibilityLabel={`Select ${choice.label.toLowerCase()}`} accessibilityState={{ selected: response?.status === "answered" && response.overall === choice.value }} onPress={() => onResponseChange({ status: "answered", overall: choice.value })} style={[styles.choice, response?.status === "answered" && response.overall === choice.value && styles.choiceSelected]}><Text style={[styles.choiceText, response?.status === "answered" && response.overall === choice.value && styles.choiceTextSelected]}>{choice.shortLabel}</Text></Pressable>)}</View>
      {response?.status === "answered" ? <Text accessibilityLiveRegion="polite" style={styles.selectedLabel}>{choices.find((choice) => choice.value === response.overall)?.label}</Text> : null}
      <Pressable accessibilityLabel="Select not sure or too soon to tell" accessibilityState={{ selected: response?.status === "not_sure" }} onPress={() => onResponseChange({ status: "not_sure" })} style={[styles.notSure, response?.status === "not_sure" && styles.notSureSelected]}><Text style={[styles.notSureText, response?.status === "not_sure" && styles.notSureTextSelected]}>Not sure / too soon to tell</Text></Pressable>
      <Text style={styles.label}>Optional note</Text>
      <TextInput accessibilityLabel="Optional note" maxLength={5000} multiline onChangeText={onNoteChange} placeholder="Add context" placeholderTextColor={colors.placeholder} style={styles.note} textAlignVertical="top" value={note} />
      <Pressable accessibilityLabel="Save check-in" accessibilityState={{ disabled: response === null }} disabled={response === null} onPress={onSave} style={[styles.saveButton, response === null && styles.saveButtonDisabled]}><Text style={styles.saveButtonText}>Save check-in</Text></Pressable>
      {status ? <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text> : null}
    </View>
  </ScrollView>;
}

const colors = { surface: "#FFFEFA", ink: "#20231F", muted: "#667067", line: "#D9DDD5", sageDark: "#34503F", placeholder: "#8A918A" };
const styles = StyleSheet.create({
  content: { gap: 18, padding: 20, paddingBottom: 56 }, header: { gap: 9, paddingTop: 4 }, backButton: { alignSelf: "flex-start", paddingVertical: 6 }, backText: { color: colors.sageDark, fontSize: 15, fontWeight: "800" }, eyebrow: { color: colors.sageDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.35, textTransform: "uppercase" }, title: { color: colors.ink, fontFamily: "Georgia", fontSize: 35, letterSpacing: -1, lineHeight: 42 }, intro: { color: colors.muted, fontSize: 15, lineHeight: 22 }, logCard: { backgroundColor: "#EDEFE9", borderRadius: 15, gap: 8, padding: 16 }, logDate: { color: colors.sageDark, fontSize: 13, fontWeight: "800" }, logBody: { color: colors.ink, fontFamily: "Georgia", fontSize: 16, lineHeight: 24 }, card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 12, padding: 20 }, label: { color: colors.ink, fontSize: 14, fontWeight: "800" }, scaleLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 }, scaleLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" }, choices: { flexDirection: "row", gap: 6 }, choice: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#BFC8BF", borderRadius: 10, borderWidth: 1, flex: 1, minHeight: 48, justifyContent: "center" }, choiceSelected: { backgroundColor: colors.sageDark, borderColor: colors.sageDark }, choiceText: { color: colors.ink, fontSize: 15, fontWeight: "800" }, choiceTextSelected: { color: "#FFFFFF" }, selectedLabel: { color: colors.sageDark, fontSize: 13, fontWeight: "800", textAlign: "center" }, notSure: { alignItems: "center", alignSelf: "center", borderColor: "#BFC8BF", borderRadius: 100, borderWidth: 1, justifyContent: "center", minHeight: 36, paddingHorizontal: 16 }, notSureSelected: { backgroundColor: colors.sageDark, borderColor: colors.sageDark }, notSureText: { color: colors.sageDark, fontSize: 13, fontWeight: "800" }, notSureTextSelected: { color: "#FFFFFF" }, note: { backgroundColor: "#FFFFFF", borderColor: "#BFC8BF", borderRadius: 11, borderWidth: 1, color: colors.ink, fontSize: 16, lineHeight: 23, minHeight: 100, padding: 14 }, saveButton: { alignItems: "center", backgroundColor: colors.sageDark, borderRadius: 100, justifyContent: "center", minHeight: 46, marginTop: 4, paddingHorizontal: 18 }, saveButtonDisabled: { backgroundColor: "#9CA89D" }, saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, status: { color: colors.sageDark, fontSize: 13, lineHeight: 18 },
});
