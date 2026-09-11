import DateTimePicker, { DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatLogDateTime } from "../journal-format";

type PickerMode = "date" | "time" | "datetime" | null;

function laterToday(now: Date): Date {
  const date = new Date(now);
  date.setMinutes(0, 0, 0);
  date.setHours(Math.min(now.getHours() + 3, 23));
  if (date <= now) date.setTime(now.getTime() + 30 * 60 * 1000);
  return date;
}

function tomorrowAt(now: Date, hour: number): Date {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return date;
}

export function ScheduleCheckInScreen({ body, eventAt, initialDate, status, onSchedule, onBack }: {
  body: string;
  eventAt: string;
  initialDate: Date;
  status: string;
  onSchedule: (date: Date) => void;
  onBack: () => void;
}) {
  const [date, setDate] = useState(initialDate);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const presets = [
    { label: "Later today", value: laterToday(new Date()) },
    { label: "Tomorrow morning", value: tomorrowAt(new Date(), 9) },
    { label: "Tomorrow evening", value: tomorrowAt(new Date(), 19) },
  ];
  function updateDate(_event: DateTimePickerChangeEvent, value?: Date) {
    if (!value) {
      setPickerMode(null);
      return;
    }
    if (Platform.OS === "android" && pickerMode === "date") {
      const next = new Date(date);
      next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
      setDate(next);
      setPickerMode("time");
      return;
    }
    if (Platform.OS === "android" && pickerMode === "time") {
      const next = new Date(date);
      next.setHours(value.getHours(), value.getMinutes(), 0, 0);
      setDate(next);
      setPickerMode(null);
      return;
    }
    setDate(value);
  }
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable accessibilityLabel="Back to log" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹ Back</Text></Pressable><Text style={styles.eyebrow}>Check in later</Text><Text style={styles.title}>When would you like to reflect?</Text><Text style={styles.intro}>This stays on your device. It will appear in Check in when it is due.</Text></View>
    <View style={styles.logCard}><Text style={styles.logDate}>{formatLogDateTime(eventAt)}</Text><Text numberOfLines={4} style={styles.logBody}>{body}</Text></View>
    <View style={styles.card}><Text style={styles.label}>Quick choices</Text><View style={styles.presets}>{presets.map((preset) => <Pressable key={preset.label} accessibilityLabel={`Schedule ${preset.label.toLowerCase()}`} onPress={() => onSchedule(preset.value)} style={styles.preset}><Text style={styles.presetText}>{preset.label}</Text><Text style={styles.presetDate}>{formatLogDateTime(preset.value.toISOString())}</Text></Pressable>)}</View><Text style={styles.label}>Choose a time</Text><Pressable accessibilityLabel={`Custom follow-up time: ${formatLogDateTime(date.toISOString())}`} onPress={() => setPickerMode(Platform.OS === "ios" ? "datetime" : "date")} style={styles.customDate}><Text style={styles.customDateText}>{formatLogDateTime(date.toISOString())}</Text><Text style={styles.changeText}>Change</Text></Pressable>{pickerMode && Platform.OS === "ios" ? <DateTimePicker display="inline" mode="datetime" onChange={updateDate} value={date} /> : null}{pickerMode && Platform.OS !== "ios" ? <DateTimePicker display="default" mode={pickerMode === "time" ? "time" : "date"} onChange={updateDate} value={date} /> : null}<Pressable accessibilityLabel="Schedule custom follow-up" onPress={() => onSchedule(date)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Schedule check-in</Text></Pressable>{status ? <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text> : null}</View>
  </ScrollView>;
}

const colors = { surface: "#FFFEFA", ink: "#20231F", muted: "#667067", line: "#D9DDD5", sageDark: "#34503F" };
const styles = StyleSheet.create({
  content: { gap: 18, padding: 20, paddingBottom: 56 }, header: { gap: 9, paddingTop: 4 }, backButton: { alignSelf: "flex-start", paddingVertical: 6 }, backText: { color: colors.sageDark, fontSize: 15, fontWeight: "800" }, eyebrow: { color: colors.sageDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.35, textTransform: "uppercase" }, title: { color: colors.ink, fontFamily: "Georgia", fontSize: 35, letterSpacing: -1, lineHeight: 42 }, intro: { color: colors.muted, fontSize: 15, lineHeight: 22 }, logCard: { backgroundColor: "#EDEFE9", borderRadius: 15, gap: 8, padding: 16 }, logDate: { color: colors.sageDark, fontSize: 13, fontWeight: "800" }, logBody: { color: colors.ink, fontFamily: "Georgia", fontSize: 16, lineHeight: 24 }, card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 12, padding: 20 }, label: { color: colors.ink, fontSize: 14, fontWeight: "800" }, presets: { gap: 8 }, preset: { backgroundColor: "#FFFFFF", borderColor: "#BFC8BF", borderRadius: 12, borderWidth: 1, gap: 3, padding: 14 }, presetText: { color: colors.ink, fontSize: 15, fontWeight: "800" }, presetDate: { color: colors.muted, fontSize: 12 }, customDate: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#BFC8BF", borderRadius: 11, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 13 }, customDateText: { color: colors.ink, fontSize: 15 }, changeText: { color: colors.sageDark, fontSize: 14, fontWeight: "800" }, primaryButton: { alignItems: "center", backgroundColor: colors.sageDark, borderRadius: 100, justifyContent: "center", minHeight: 46, marginTop: 4, paddingHorizontal: 18 }, primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, status: { color: colors.sageDark, fontSize: 13, lineHeight: 18 },
});
