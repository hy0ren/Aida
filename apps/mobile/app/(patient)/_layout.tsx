import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../components/aida";

type TabIcon = keyof typeof MaterialCommunityIcons.glyphMap;

function tabIcon(name: TabIcon) {
  return ({ color, size }: { color: string; size: number }) => (
    <MaterialCommunityIcons name={name} color={color} size={size} />
  );
}

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: "#7f8d89",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
          marginTop: 2,
        },
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 18,
          height: 74,
          paddingTop: 10,
          paddingBottom: 14,
          borderRadius: 28,
          borderTopWidth: 0,
          backgroundColor: "rgba(255,255,255,0.94)",
          shadowColor: "#0f201d",
          shadowOpacity: 0.12,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
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
