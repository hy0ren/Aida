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
  const { isReady, isLoggedIn, onboardingComplete, role, theme, mode, t } = useAidaTheme();

  if (!isReady) return null;
  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;
  if (!onboardingComplete) return <Redirect href="/(auth)/onboarding" />;
  if (role !== "provider") return <Redirect href={getHomeRouteForRole(role) as never} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        header: () => null,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.faint,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 70,
          paddingTop: 0,
          paddingBottom: 20,
          borderTopWidth: 0,
          borderTopColor: "transparent",
          backgroundColor: mode === "dark" ? "#242428" : "#ffffff",
          shadowColor: "transparent",
          shadowOpacity: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t("today"), tabBarIcon: tabIcon("view-dashboard-outline") }} />
      <Tabs.Screen name="patients" options={{ title: t("patients"), tabBarIcon: tabIcon("account-group-outline") }} />
      <Tabs.Screen name="schedule" options={{ title: t("schedule"), tabBarIcon: tabIcon("calendar-edit") }} />
      <Tabs.Screen name="settings" options={{ title: t("settings"), tabBarIcon: tabIcon("cog-outline") }} />
      <Tabs.Screen name="history" options={hiddenTabOptions} />
    </Tabs>
  );
}
