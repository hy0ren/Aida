import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { apiPost } from "../../lib/api";
import {
  Card,
  Icon,
  PrimaryButton,
  StepDots,
  colors,
  getHomeRouteForRole,
  useAidaTheme,
} from "../../components/aida";

const WORLD_APP_ID = process.env.EXPO_PUBLIC_WORLD_APP_ID ?? "";
const WORLD_ACTION_ID = process.env.EXPO_PUBLIC_WORLD_ACTION_ID ?? "aida-verify";
const BRIDGE_URL = "https://bridge.worldcoin.org";

type WorldIdProof = {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level: string;
};

async function startWorldIdBridge(): Promise<WorldIdProof> {
  const requestId = crypto.randomUUID();
  const key = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyBase64 = btoa(String.fromCharCode(...key));

  const initRes = await fetch(`${BRIDGE_URL}/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: WORLD_APP_ID,
      action: WORLD_ACTION_ID,
      signal: "",
      request_id: requestId,
    }),
  });

  if (!initRes.ok) throw new Error("Failed to start World ID bridge session");

  const worldAppUrl = `https://worldcoin.org/verify?t=wld&i=${requestId}&k=${encodeURIComponent(keyBase64)}`;
  await WebBrowser.openBrowserAsync(worldAppUrl);

  const pollRes = await fetch(`${BRIDGE_URL}/response/${requestId}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!pollRes.ok) throw new Error("Bridge did not return a response");

  const { iv: respIv, payload } = (await pollRes.json()) as {
    iv: string;
    payload: string;
  };

  const cryptoKey = await crypto.subtle.importKey("raw", key, "AES-GCM", false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Uint8Array.from(atob(respIv), (c) => c.charCodeAt(0)) },
    cryptoKey,
    Uint8Array.from(atob(payload), (c) => c.charCodeAt(0)),
  );

  return JSON.parse(new TextDecoder().decode(decrypted)) as WorldIdProof;
}

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [stage, setStage] = useState<"ready" | "scanning" | "done" | "error">("ready");
  const [errorMsg, setErrorMsg] = useState("");
  const { login, role, theme } = useAidaTheme();

  const navigateAfterVerify = useCallback(() => {
    setTimeout(() => {
      router.replace(
        params.mode === "signup" ? "/(auth)/onboarding" : (getHomeRouteForRole(role) as never),
      );
    }, 700);
  }, [params.mode, role, router]);

  async function begin() {
    setStage("scanning");
    setErrorMsg("");

    const isWorldIdConfigured = Boolean(WORLD_APP_ID);

    if (!isWorldIdConfigured) {
      try {
        await apiPost("/auth/verify", { proof: null, action: WORLD_ACTION_ID });
      } catch {
        // Backend mock-succeeds when WORLD_ID_APP_ID is unset
      }
      setStage("done");
      login();
      navigateAfterVerify();
      return;
    }

    try {
      const proof = await startWorldIdBridge();
      await apiPost("/auth/verify", { proof, action: WORLD_ACTION_ID });
      setStage("done");
      login();
      navigateAfterVerify();
    } catch (err) {
      setStage("error");
      setErrorMsg(err instanceof Error ? err.message : "Verification failed");
    }
  }

  const statusLabel =
    stage === "ready"
      ? "Proof of personhood"
      : stage === "scanning"
        ? "Checking proof..."
        : stage === "error"
          ? "Verification failed"
          : "Verified";

  const isWorldIdConfigured = Boolean(WORLD_APP_ID);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.wash,
        padding: 22,
        justifyContent: "space-between",
      }}
    >
      <View style={{ paddingTop: 64 }}>
        <Pressable onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color={theme.ink} />
        </Pressable>
        <Text
          style={{
            color: theme.ink,
            fontSize: 36,
            fontWeight: "900",
            marginTop: 32,
            letterSpacing: -0.3,
          }}
        >
          Verify once. Book safely.
        </Text>
        <Text
          style={{
            color: theme.muted,
            fontSize: 16,
            lineHeight: 24,
            marginTop: 12,
          }}
        >
          World ID helps prevent duplicate or fraudulent appointment bookings
          before a patient account is created.
        </Text>
      </View>

      <Card style={{ alignItems: "center", paddingVertical: 34 }}>
        <View
          style={{
            width: 132,
            height: 132,
            borderRadius: 66,
            borderWidth: 2,
            borderColor:
              stage === "done"
                ? colors.green
                : stage === "error"
                  ? colors.red
                  : theme.accent,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.surface,
          }}
        >
          {stage === "scanning" ? (
            <ActivityIndicator size="large" color={theme.accent} />
          ) : (
            <Icon
              name={
                stage === "done"
                  ? "check"
                  : stage === "error"
                    ? "alert-circle-outline"
                    : "account-circle-outline"
              }
              size={58}
              color={
                stage === "done"
                  ? colors.green
                  : stage === "error"
                    ? colors.red
                    : theme.accent
              }
            />
          )}
        </View>
        <Text
          style={{
            color: stage === "error" ? colors.red : theme.ink,
            fontSize: 20,
            fontWeight: "900",
            marginTop: 22,
          }}
        >
          {statusLabel}
        </Text>
        <Text
          style={{
            color: theme.muted,
            fontSize: 14,
            lineHeight: 21,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {stage === "error"
            ? errorMsg
            : isWorldIdConfigured
              ? "No SSN required. World ID verifies you are a unique person."
              : "No SSN required. World ID verification will activate when credentials are configured."}
        </Text>
        <View style={{ marginTop: 22 }}>
          <StepDots
            count={3}
            active={stage === "ready" ? 0 : stage === "scanning" ? 1 : 2}
          />
        </View>
      </Card>

      <View style={{ gap: 10 }}>
        <PrimaryButton
          disabled={stage === "scanning"}
          icon="earth"
          label={
            stage === "ready" || stage === "error"
              ? "Begin verification"
              : "Verifying"
          }
          onPress={begin}
        />
        <Text style={{ color: theme.muted, textAlign: "center", lineHeight: 20 }}>
          Verification protects appointment booking before you choose patient,
          parent, or provider.
        </Text>
      </View>
    </View>
  );
}
