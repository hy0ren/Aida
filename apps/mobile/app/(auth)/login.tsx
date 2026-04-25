import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  Field,
  Icon,
  PrimaryButton,
  SecondaryButton,
  fonts,
  useAidaTheme,
} from "../../components/aida";
import { authLogin, authSignup } from "../../lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "aida.authToken";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { theme, logout, login } = useAidaTheme();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.mode === "login") setMode("login");
    if (params.mode === "signup") {
      logout();
      setMode("signup");
    }
  }, [params.mode, logout]);

  async function handleSubmit() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    if (isSignup && password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = isSignup
        ? await authSignup(trimmedEmail, password)
        : await authLogin(trimmedEmail, password);

      // Persist token
      await AsyncStorage.setItem(TOKEN_KEY, result.token);

      // Update local auth state
      login();

      // Navigate to verify → onboarding (signup) or home (login)
      router.push("/(auth)/verify");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      Alert.alert(isSignup ? "Sign up failed" : "Login failed", message);
    } finally {
      setLoading(false);
    }
  }

  function continueWithGoogle() {
    // Placeholder — Google OAuth not yet wired
    Alert.alert("Coming soon", "Google authentication will be available in a future update.");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.wash }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 6 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, padding: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
      <View style={{ paddingTop: 70, flex: 1, minHeight: 160 }}>
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
              onPress={() => {
                if (item === "signup") {
                  logout();
                }
                setMode(item);
              }}
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
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@clinic.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            importantForAutofill="yes"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={isSignup ? "password-new" : "password"}
            textContentType={isSignup ? "newPassword" : "password"}
            returnKeyType="go"
            importantForAutofill="yes"
          />

          <PrimaryButton
            onPress={handleSubmit}
            icon={loading ? "creation" : isSignup ? "account-plus" : "login"}
            label={loading ? (isSignup ? "Creating account…" : "Logging in…") : isSignup ? "Create account" : "Login"}
            disabled={loading}
          />
          <SecondaryButton
            onPress={continueWithGoogle}
            icon="google"
            label={isSignup ? "Sign up with Google" : "Login with Google"}
          />
        </View>

        {loading && (
          <View style={{ alignItems: "center", marginTop: 16 }}>
            <ActivityIndicator size="small" color={theme.accent} />
          </View>
        )}
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
