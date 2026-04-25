import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AidaThemeProvider } from "../components/aida";

export default function RootLayout() {
  return (
    <AidaThemeProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#eff4f1" },
        }}
      >
        <Stack.Screen
          name="(auth)"
          options={{ animation: "slide_from_right", animationTypeForReplace: "pop" }}
        />
        <Stack.Screen name="(patient)" />
        <Stack.Screen name="(provider)" />
      </Stack>
    </AidaThemeProvider>
  );
}
