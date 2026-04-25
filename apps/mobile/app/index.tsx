import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { getHomeRouteForRole, useAidaTheme } from "../components/aida";

export default function Index() {
  const { isReady, isLoggedIn, onboardingComplete, role, theme } = useAidaTheme();

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.wash }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!onboardingComplete) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href={getHomeRouteForRole(role) as never} />;
}
