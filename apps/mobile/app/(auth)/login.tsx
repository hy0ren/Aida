import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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
import { GlassScanner, type CapturedCard } from "../../components/GlassScanner";
import { uploadPatientIntake } from "../../lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { theme, logout } = useAidaTheme();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [frontCard, setFrontCard] = useState<CapturedCard | null>(null);
  const [backCard, setBackCard] = useState<CapturedCard | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (params.mode === "login") setMode("login");
    if (params.mode === "signup") {
      logout();
      setMode("signup");
    }
  }, [params.mode, logout]);

  async function continueWithEmail() {
    if (isSignup && (frontCard || backCard)) {
      setIsUploading(true);
      try {
        const files: Array<{ name: string; type: any; data: string }> = [];
        if (frontCard?.base64) {
          files.push({ name: "insurance-card-front.jpg", type: "insurance-front", data: `data:image/jpeg;base64,${frontCard.base64}` });
        }
        if (backCard?.base64) {
          files.push({ name: "insurance-card-back.jpg", type: "insurance-back", data: `data:image/jpeg;base64,${backCard.base64}` });
        }
        await uploadPatientIntake({
          insuranceComplete: Boolean(frontCard && backCard),
          healthComplete: false,
          healthSource: "Apple Health",
          notes: "Uploaded during sign up",
          files,
        });
      } catch (err) {
        console.warn("Upload failed during signup:", err);
      }
      setIsUploading(false);
    }
    router.push("/(auth)/verify");
  }

  function continueWithGoogle() {
    router.push("/(auth)/verify");
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

          {isSignup && (
            <View style={{ gap: 10, marginTop: 4 }}>
              <GlassScanner
                label="Front of card"
                detail="Name, plan, member ID"
                value={frontCard}
                onChange={setFrontCard}
              />
              <GlassScanner
                label="Back of card"
                detail="Claims phone and payer details"
                value={backCard}
                onChange={setBackCard}
              />
            </View>
          )}

          <PrimaryButton
            onPress={continueWithEmail}
            icon={isSignup && isUploading ? "creation" : isSignup ? "account-plus" : "login"}
            label={isSignup && isUploading ? "Creating account…" : isSignup ? "Create account" : "Login"}
            disabled={isUploading}
          />
          <SecondaryButton
            onPress={continueWithGoogle}
            icon="google"
            label={isSignup ? "Sign up with Google" : "Login with Google"}
            disabled={isUploading}
          />
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
