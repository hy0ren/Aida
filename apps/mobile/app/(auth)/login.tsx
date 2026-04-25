import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Field,
  Icon,
  PrimaryButton,
  SecondaryButton,
  fonts,
  useAidaTheme,
} from "../../components/aida";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { theme } = useAidaTheme();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const isSignup = mode === "signup";

  useEffect(() => {
    if (params.mode === "login") setMode("login");
    if (params.mode === "signup") setMode("signup");
  }, [params.mode]);

  function continueWithEmail() {
    router.push("/(auth)/verify");
  }

  function continueWithGoogle() {
    router.push("/(auth)/verify");
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.wash,
        padding: 22,
      }}
    >
      <View style={{ paddingTop: 70, flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: theme.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="triangle" size={22} color="#fff" />
          </View>
          <Text
            style={{
              color: theme.ink,
              fontSize: 30,
              fontWeight: "700",
              fontFamily: fonts.display,
            }}
          >
            Aida
          </Text>
        </View>

        <Text
          style={{
            color: theme.ink,
            fontSize: 42,
            lineHeight: 47,
            fontWeight: "700",
            marginTop: 34,
            letterSpacing: -0.4,
            fontFamily: fonts.display,
          }}
        >
          Healthcare, without borders
        </Text>
        <Text
          style={{
            color: theme.muted,
            fontSize: 16,
            lineHeight: 24,
            marginTop: 16,
            fontFamily: fonts.body,
          }}
        >
          Let Aida bring you to the professionals you need.
        </Text>
      </View>

      <View style={{ paddingBottom: 18 }}>
        <View
          style={{
            flexDirection: "row",
            padding: 4,
            borderRadius: 18,
            backgroundColor: theme.surface,
            marginBottom: 16,
          }}
        >
          {(["login", "signup"] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setMode(item)}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: mode === item ? theme.card : "transparent",
              }}
            >
              <Text
                style={{
                  color: mode === item ? theme.ink : theme.muted,
                  fontWeight: "900",
                }}
              >
                {item === "login" ? "Login" : "Sign Up"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 12 }}>
          <Field label="Email" value="maria@example.com" keyboardType="email-address" />
          <Field label="Password" value="password123" secureTextEntry />
          <PrimaryButton
            onPress={continueWithEmail}
            icon={isSignup ? "account-plus" : "login"}
            label={isSignup ? "Create account" : "Login"}
          />
          <SecondaryButton
            onPress={continueWithGoogle}
            icon="google"
            label={isSignup ? "Sign up with Google" : "Login with Google"}
          />
        </View>

        <Text style={{ color: theme.muted, marginTop: 18, textAlign: "center", lineHeight: 20 }}>
          Verification comes next. Then choose patient, parent, or provider.
        </Text>
      </View>
    </View>
  );
}
