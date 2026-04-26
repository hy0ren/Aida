import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { ResponseType, getDefaultReturnUrl, getRedirectUrl, makeRedirectUri } from "expo-auth-session";
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
  getHomeRouteForRole,
  useAidaTheme,
} from "../../components/aida";
import { authGoogle, authLogin, authSignup, TOKEN_KEY } from "../../lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_EXPO_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID
  || "837185143326-k05fjad97srq3m9iee3osdbr70cgkn51.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
  || "837185143326-v8s27jl841cesgta6h5n1vlvnj6o55sg.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  || "837185143326-k05fjad97srq3m9iee3osdbr70cgkn51.apps.googleusercontent.com";
const GOOGLE_REDIRECT_URI = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI;
const GOOGLE_IOS_REVERSED_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID
  || "com.googleusercontent.apps.837185143326-v8s27jl841cesgta6h5n1vlvnj6o55sg:/oauthredirect";

function getExpoProxyRedirectUri() {
  if (GOOGLE_REDIRECT_URI) return GOOGLE_REDIRECT_URI;
  try {
    return getRedirectUrl();
  } catch {
    return "https://auth.expo.io/@anonymous/mobile";
  }
}

function getTokenFromAuthUrl(url: string) {
  const [, hash = ""] = url.split("#");
  const query = url.includes("?") ? url.split("?")[1]?.split("#")[0] ?? "" : "";
  return new URLSearchParams(hash || query).get("access_token");
}

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { theme, logout, login, applyAuthUser, t } = useAidaTheme();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isExpoGo = Constants.appOwnership === "expo";
  const redirectUri = isExpoGo
    ? getExpoProxyRedirectUri()
    : makeRedirectUri({
        scheme: "aida",
        native: Platform.OS === "ios" ? GOOGLE_IOS_REVERSED_CLIENT_ID : undefined,
        path: "oauthredirect",
      });
  const googleConfig = isExpoGo
    ? ({
        clientId: GOOGLE_WEB_CLIENT_ID || GOOGLE_EXPO_CLIENT_ID,
        redirectUri,
        responseType: ResponseType.Token,
        usePKCE: false,
      } as const)
    : ({
        iosClientId: GOOGLE_IOS_CLIENT_ID,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID,
        webClientId: GOOGLE_WEB_CLIENT_ID,
        redirectUri,
      } as const);
  const [request, response, promptAsync] = Google.useAuthRequest(googleConfig);

  useEffect(() => {
    if (__DEV__) {
      console.log("Google OAuth redirect URI:", redirectUri);
      console.log("Google OAuth auth URL:", request?.url);
    }
  }, [redirectUri, request?.url]);

  useEffect(() => {
    if (params.mode === "login") setMode("login");
    if (params.mode === "signup") {
      logout();
      setMode("signup");
    }
  }, [params.mode, logout]);

  useEffect(() => {
    if (response?.type === "success") {
      const accessToken = response.authentication?.accessToken;
      if (!accessToken) {
        Alert.alert(t("googleLoginFailed"), t("googleNoToken"));
        return;
      }
      void completeGoogleLogin(accessToken);
    } else if (response?.type === "error") {
      Alert.alert(t("googleLoginFailed"), response.error?.message ?? t("googleCancelled"));
    }
  }, [applyAuthUser, response, router, t]);

  async function handleSubmit() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert(t("missingFieldsTitle"), t("missingFieldsBody"));
      return;
    }
    if (isSignup && password.length < 6) {
      Alert.alert(t("weakPasswordTitle"), t("weakPasswordBody"));
      return;
    }

    setLoading(true);
    try {
      const result = isSignup
        ? await authSignup(trimmedEmail, password)
        : await authLogin(trimmedEmail, password);

      // Persist token
      await AsyncStorage.setItem(TOKEN_KEY, result.token);
      applyAuthUser(result.user);

      // Signup: logged in but onboarding not done until they finish the flow
      if (isSignup) {
        login();
        router.push("/(auth)/verify?mode=signup");
      } else if (result.user.onboardingComplete) {
        const nextRole =
          result.user.role === "provider" || result.user.role === "parent" ? result.user.role : "patient";
        router.replace(getHomeRouteForRole(nextRole) as never);
      } else {
        router.replace("/(auth)/onboarding");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("somethingWentWrong");
      Alert.alert(isSignup ? t("signUpFailed") : t("loginFailed"), message);
    } finally {
      setLoading(false);
    }
  }

  async function completeGoogleLogin(accessToken: string) {
    setGoogleLoading(true);
    try {
      const result = await authGoogle(accessToken);
      await AsyncStorage.setItem(TOKEN_KEY, result.token);
      applyAuthUser(result.user);

      if (result.user.onboardingComplete) {
        const nextRole =
          result.user.role === "provider" || result.user.role === "parent" ? result.user.role : "patient";
        router.replace(getHomeRouteForRole(nextRole) as never);
      } else {
        router.replace("/(auth)/onboarding");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("googleCouldNotComplete");
      Alert.alert(t("googleLoginFailed"), message);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function continueWithGoogle() {
    if (!request) return;
    if (!isExpoGo) {
      void promptAsync();
      return;
    }

    setGoogleLoading(true);
    try {
      if (!request.url) {
        Alert.alert(t("googleLoginFailed"), t("googleStillLoading"));
        return;
      }

      const returnUrl = getDefaultReturnUrl();
      const startUrl = `${getExpoProxyRedirectUri()}/start?${new URLSearchParams({
        authUrl: request.url,
        returnUrl,
      }).toString()}`;
      const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);

      if (result.type !== "success") return;
      const accessToken = getTokenFromAuthUrl(result.url);
      if (!accessToken) {
        Alert.alert(t("googleLoginFailed"), t("googleNoToken"));
        return;
      }
      await completeGoogleLogin(accessToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("googleCouldNotComplete");
      Alert.alert(t("googleLoginFailed"), message);
    } finally {
      setGoogleLoading(false);
    }
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
          {t("heroTitle")}
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
          {t("heroSubtitle")}
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
                {item === "login" ? t("login") : t("signUp")}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 12 }}>
          <Field
            label={t("email")}
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
            label={t("password")}
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
            label={loading ? (isSignup ? t("creatingAccount") : t("loggingIn")) : isSignup ? t("createAccount") : t("login")}
            disabled={loading}
          />
          <SecondaryButton
            onPress={continueWithGoogle}
            icon="google"
            label={googleLoading ? t("connectingGoogle") : isSignup ? t("signUpWithGoogle") : t("loginWithGoogle")}
            disabled={!request || loading || googleLoading}
          />
        </View>

        {(loading || googleLoading) && (
          <View style={{ alignItems: "center", marginTop: 16 }}>
            <ActivityIndicator size="small" color={theme.accent} />
          </View>
        )}
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
