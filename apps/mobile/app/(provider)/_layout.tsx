import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { getHomeRouteForRole, useAidaTheme } from "../../components/aida";

type TabIcon = keyof typeof MaterialCommunityIcons.glyphMap;

function tabIcon(name: TabIcon) {
  return ({ color, size }: { color: string; size: number }) => (
    <MaterialCommunityIcons name={name} color={color} size={size} />
  );
}

const hiddenTabOptions = { href: null };

export default function ProviderLayout() {
  const { isReady, isLoggedIn, onboardingComplete, role, theme, mode } = useAidaTheme();

  if (!isReady) return null;
  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;
  if (!onboardingComplete) return <Redirect href="/(auth)/onboarding" />;
  if (role !== "provider") return <Redirect href={getHomeRouteForRole(role) as never} />;

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
      <Tabs.Screen name="history" options={hiddenTabOptions} />
    </Tabs>
  );
}
