import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { formatLogAccessibilityDateTime, formatLogDateTime } from "../journal-format";
import { JournalCategory, JournalSnapshot } from "../journal-storage";

export type PickerMode = "date" | "time" | "datetime" | null;

export function LogComposerScreen({ journal, mode, body, eventDate, categoryIds, newCategoryName, pickerMode, status, onBodyChange, onPickerModeChange, onDateChange, onCategoryToggle, onNewCategoryNameChange, onCreateCategory, onArchiveRequest, onSave, onCancel }: {
  journal: JournalSnapshot;
  mode: "new" | "edit";
  body: string;
  eventDate: Date;
  categoryIds: string[];
  newCategoryName: string;
  pickerMode: PickerMode;
  status: string;
  onBodyChange: (value: string) => void;
  onPickerModeChange: (value: PickerMode | ((current: PickerMode) => PickerMode)) => void;
  onDateChange: (event: DateTimePickerEvent, date?: Date) => void;
  onCategoryToggle: (id: string) => void;
  onNewCategoryNameChange: (value: string) => void;
  onCreateCategory: () => void;
  onArchiveRequest: (category: JournalCategory) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const activeCategories = journal.categories.filter((category) => !category.archivedAt);
  const archivedDraftCategories = journal.categories.filter((category) => category.archivedAt && categoryIds.includes(category.id));
  const actionLabel = mode === "edit" ? "Update log" : "Save log";

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable accessibilityLabel="Cancel" onPress={onCancel} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable><Text style={styles.eyebrow}>{mode === "edit" ? "Editing log" : "New log"}</Text><Text style={styles.title}>{mode === "edit" ? "Make a correction" : "Write a log"}</Text></View>
    <View style={styles.card}>
      <Text style={styles.label}>What happened?</Text>
      <TextInput accessibilityLabel="What happened?" multiline maxLength={5000} onChangeText={onBodyChange} placeholder="Write about anything." placeholderTextColor={colors.placeholder} style={styles.textArea} textAlignVertical="top" value={body} />
      <Text style={styles.label}>When did it happen?</Text>
      <Pressable accessibilityHint="Opens the date and time picker" accessibilityLabel={`Event time: ${formatLogAccessibilityDateTime(eventDate.toISOString())}`} onPress={() => onPickerModeChange((current) => current ? null : Platform.OS === "ios" ? "datetime" : "date")} style={styles.dateButton}><Text style={styles.dateButtonText}>{formatLogDateTime(eventDate.toISOString())}</Text><Text style={styles.dateButtonEdit}>Change</Text></Pressable>
      {pickerMode && <DateTimePicker display={Platform.OS === "ios" ? "inline" : "default"} mode={pickerMode} onChange={onDateChange} value={eventDate} />}
      <Text style={styles.label}>Categories</Text>
      <View style={styles.chips}>{activeCategories.map((category) => <Pressable key={category.id} accessibilityRole="checkbox" accessibilityState={{ checked: categoryIds.includes(category.id) }} onPress={() => onCategoryToggle(category.id)} style={[styles.chip, categoryIds.includes(category.id) && styles.chipSelected]}><Text style={[styles.chipText, categoryIds.includes(category.id) && styles.chipTextSelected]}>{category.name}</Text></Pressable>)}{archivedDraftCategories.map((category) => <View key={category.id} style={styles.archivedChip}><Text style={styles.archivedChipText}>{category.name} (archived)</Text></View>)}</View>
      <View style={styles.addCategory}><TextInput accessibilityLabel="New category name" onChangeText={onNewCategoryNameChange} onSubmitEditing={onCreateCategory} placeholder="Create a category" placeholderTextColor={colors.placeholder} style={styles.categoryInput} value={newCategoryName} /><Pressable accessibilityLabel="Add category" onPress={onCreateCategory} style={styles.addButton}><Text style={styles.addButtonText}>Add</Text></Pressable></View>
      <Pressable accessibilityLabel={actionLabel} accessibilityState={{ disabled: !body.trim() }} disabled={!body.trim()} onPress={onSave} style={[styles.primaryButton, !body.trim() && styles.primaryButtonDisabled]}><Text style={styles.primaryButtonText}>{actionLabel}</Text></Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text>
    </View>
    <View style={styles.manager}><Text style={styles.eyebrow}>Category management</Text><Text style={styles.managerText}>Archive a category when you no longer want it in new logs. Past logs and Trends stay intact.</Text>{activeCategories.map((category) => <View key={category.id} style={styles.managerRow}><Text style={styles.managerName}>{category.name}</Text><Pressable accessibilityLabel={`Archive ${category.name}`} onPress={() => onArchiveRequest(category)}><Text style={styles.archiveAction}>Archive</Text></Pressable></View>)}</View>
  </ScrollView>;
}

const colors = { surface: "#FFFEFA", ink: "#20231F", muted: "#667067", line: "#D9DDD5", sageDark: "#34503F", placeholder: "#8A918A", warning: "#714F20" };
const styles = StyleSheet.create({
  content: { gap: 20, padding: 20, paddingBottom: 56 }, header: { gap: 8, paddingTop: 4 }, cancelButton: { alignSelf: "flex-start", paddingVertical: 6 }, cancelText: { color: colors.sageDark, fontSize: 15, fontWeight: "800" }, eyebrow: { color: colors.sageDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.35, textTransform: "uppercase" }, title: { color: colors.ink, fontFamily: "Georgia", fontSize: 35, letterSpacing: -1, lineHeight: 42 }, card: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 18, borderWidth: 1, gap: 12, padding: 20 }, label: { color: colors.ink, fontSize: 14, fontWeight: "700", marginTop: 8 }, textArea: { backgroundColor: "#FFFFFF", borderColor: "#BFC8BF", borderRadius: 11, borderWidth: 1, color: colors.ink, fontSize: 16, lineHeight: 24, minHeight: 180, padding: 14 }, dateButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#BFC8BF", borderRadius: 11, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 13 }, dateButtonText: { color: colors.ink, fontSize: 15 }, dateButtonEdit: { color: colors.sageDark, fontSize: 14, fontWeight: "800" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { backgroundColor: "#FFFFFF", borderColor: "#BFC8BF", borderRadius: 100, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 }, chipSelected: { backgroundColor: colors.sageDark, borderColor: colors.sageDark }, chipText: { color: colors.ink, fontSize: 13, fontWeight: "700" }, chipTextSelected: { color: "#FFFFFF" }, archivedChip: { backgroundColor: "#E9E8E3", borderColor: colors.line, borderRadius: 100, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 }, archivedChipText: { color: colors.muted, fontSize: 13, fontWeight: "700" }, addCategory: { flexDirection: "row", gap: 8 }, categoryInput: { backgroundColor: "#FFFFFF", borderColor: "#BFC8BF", borderRadius: 10, borderWidth: 1, color: colors.ink, flex: 1, fontSize: 14, paddingHorizontal: 12, paddingVertical: 10 }, addButton: { alignItems: "center", backgroundColor: "#E8EEE7", borderRadius: 10, justifyContent: "center", paddingHorizontal: 14 }, addButtonText: { color: colors.sageDark, fontSize: 14, fontWeight: "800" }, primaryButton: { alignItems: "center", backgroundColor: colors.sageDark, borderRadius: 100, justifyContent: "center", minHeight: 46, marginTop: 8, paddingHorizontal: 18 }, primaryButtonDisabled: { backgroundColor: "#9CA89D" }, primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, status: { color: colors.sageDark, fontSize: 13, lineHeight: 18, minHeight: 18 }, manager: { backgroundColor: "#EDEFE9", borderRadius: 14, gap: 10, padding: 16 }, managerText: { color: colors.muted, fontSize: 13, lineHeight: 19 }, managerRow: { alignItems: "center", borderTopColor: "#D5DAD2", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingTop: 10 }, managerName: { color: colors.ink, fontSize: 14, fontWeight: "700" }, archiveAction: { color: colors.warning, fontSize: 13, fontWeight: "800" },
});
