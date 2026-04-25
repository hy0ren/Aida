import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useAidaTheme } from "../../components/aida";

type TabIcon = keyof typeof MaterialCommunityIcons.glyphMap;

function tabIcon(name: TabIcon) {
  return ({ color, size }: { color: string; size: number }) => (
    <MaterialCommunityIcons name={name} color={color} size={size} />
  );
}

export default function ProviderLayout() {
  const { theme, mode } = useAidaTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.faint,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 76,
          paddingTop: 8,
          paddingBottom: 18,
          borderTopWidth: 0,
          backgroundColor: mode === "dark" ? "#242428" : "#ffffff",
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -3 },
          elevation: 6,
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Today", tabBarIcon: tabIcon("view-dashboard-outline") }} />
      <Tabs.Screen name="patients" options={{ title: "Patients", tabBarIcon: tabIcon("account-group-outline") }} />
      <Tabs.Screen name="schedule" options={{ title: "Schedule", tabBarIcon: tabIcon("calendar-edit") }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: tabIcon("cog-outline") }} />
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}
