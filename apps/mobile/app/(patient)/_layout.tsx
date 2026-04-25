import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useAidaTheme } from "../../components/aida";

type TabIcon = keyof typeof MaterialCommunityIcons.glyphMap;

function tabIcon(name: TabIcon) {
  return ({ color, size }: { color: string; size: number }) => (
    <MaterialCommunityIcons name={name} color={color} size={size} />
  );
}

export default function PatientLayout() {
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
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: tabIcon("view-dashboard-outline"),
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: "Schedule",
          tabBarIcon: tabIcon("calendar-clock"),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: tabIcon("clipboard-text-clock-outline"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: tabIcon("account-circle-outline"),
        }}
      />
      <Tabs.Screen name="upload" options={{ href: null }} />
      <Tabs.Screen name="summary" options={{ href: null }} />
      <Tabs.Screen name="call-status" options={{ href: null }} />
      <Tabs.Screen name="confirmation" options={{ href: null }} />
    </Tabs>
  );
}
