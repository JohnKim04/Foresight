import { Pressable, StyleSheet, Text, View } from "react-native";
import { TopLevelRoute } from "../journal-navigation";

export function ScreenTabs({ screen, onChange }: { screen: TopLevelRoute; onChange: (screen: TopLevelRoute) => void }) {
  return (
    <View style={styles.tabs}>
      {(["journal", "trends"] as const).map((tab) => (
        <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: screen === tab }} onPress={() => onChange(tab)} style={[styles.tab, screen === tab && styles.tabActive]}>
          <Text style={[styles.tabText, screen === tab && styles.tabTextActive]}>{tab === "journal" ? "Journal" : "Trends"}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { backgroundColor: "#E6E8E2", borderRadius: 12, flexDirection: "row", padding: 3 },
  tab: { alignItems: "center", borderRadius: 9, flex: 1, paddingVertical: 9 },
  tabActive: { backgroundColor: "#FFFEFA" },
  tabText: { color: "#667067", fontSize: 14, fontWeight: "700" },
  tabTextActive: { color: "#20231F" },
});
