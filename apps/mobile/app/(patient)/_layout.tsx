import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { getHomeRouteForRole, useAidaTheme } from "../../components/aida";

type TabIcon = keyof typeof MaterialCommunityIcons.glyphMap;

function tabIcon(name: TabIcon) {
  return ({ color, size }: { color: string; size: number }) => (
    <MaterialCommunityIcons name={name} color={color} size={size} />
  );
}

// Hide from tab bar; must not set `tabBarButton` with `href` (Expo Router disallows both).
const hiddenTabOptions = { href: null as const };

export default function PatientLayout() {
  const { isReady, isLoggedIn, onboardingComplete, role, theme, mode } = useAidaTheme();

  if (!isReady) return null;
  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;
  if (!onboardingComplete) return <Redirect href="/(auth)/onboarding" />;
  if (role === "provider") return <Redirect href={getHomeRouteForRole(role) as never} />;

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
      <Tabs.Screen name="upload" options={hiddenTabOptions} />
      <Tabs.Screen name="summary" options={hiddenTabOptions} />
      <Tabs.Screen name="call-status" options={hiddenTabOptions} />
      <Tabs.Screen name="confirmation" options={hiddenTabOptions} />
    </Tabs>
  );
}
