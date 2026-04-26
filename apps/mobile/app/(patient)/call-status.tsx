import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { demoData, type CallSessionResponse } from "@aida/shared";
import { initiateCall } from "../../lib/api";
import { Icon, PrimaryButton, useAidaTheme } from "../../components/aida";

export default function CallStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ providerId?: string }>();
  const { language, theme, userId, patientProfile, t } = useAidaTheme();
  const patientName = `${patientProfile.firstName} ${patientProfile.lastName}`.trim();
  const [stage, setStage] = useState(0);
  const [lineCount, setLineCount] = useState(1);
  const [callState, setCallState] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<CallSessionResponse | null>(null);
  const stages = session?.stages ?? demoData.providerIntake.callStages;
  const transcript = session?.transcript ?? demoData.providerIntake.callTranscript;
  const clinicName = session?.clinicName ?? demoData.providers[0].name;

  useEffect(() => {
    let mounted = true;

    initiateCall({
      providerId: params.providerId ?? demoData.providers[0].id,
      patientId: userId ?? demoData.patient.id,
      patientName,
      language,
      summaryId: demoData.healthSummary.id,
    })
      .then((response) => {
        if (!mounted) return;
        setSession(response);
        setCallState("success");
        setStage(0);
        setLineCount(1);
      })
      .catch((error) => {
        if (!mounted) return;
        setCallState("error");
        setErrorMessage(error instanceof Error ? error.message : t("callFailedConnection"));
      });

    return () => {
      mounted = false;
    };
  }, [language, params.providerId, patientName, userId]);

  useEffect(() => {
    if (callState === "loading") return;

    if (stage < stages.length - 1) {
      const timer = setTimeout(() => setStage((value) => value + 1), 1400);
      return () => clearTimeout(timer);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [callState, stage, stages.length]);

  useEffect(() => {
    if (callState === "loading") return;

    const timer = setInterval(
      () => setLineCount((value) => Math.min(transcript.length, value + 1)),
      900,
    );
    return () => clearInterval(timer);
  }, [callState, transcript.length]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#18181b",
        padding: 22,
        paddingTop: 72,
        paddingBottom: 94,
      }}
    >
      <View style={{ alignItems: "center" }}>
        <Text style={{ color: "#a1a1aa", fontSize: 12, fontWeight: "800" }}>
          {clinicName.toUpperCase()}
        </Text>
        <Text
          style={{
            color: "#fff",
            fontSize: 34,
            fontWeight: "900",
            marginTop: 10,
            textAlign: "center",
          }}
        >
          {callState === "loading" ? t("startingCall") : callState === "error" ? t("callPaused") : stages[stage]}
        </Text>
        <View
          style={{
            marginTop: 18,
            height: 150,
            flexDirection: "row",
            gap: 5,
            alignItems: "center",
          }}
        >
          {Array.from({ length: 26 }).map((_, index) => (
            <View
              key={index}
              style={{
                width: 5,
                height: 18 + ((index * 13 + stage * 17) % 74),
                borderRadius: 5,
                backgroundColor: theme.accent,
                opacity: 0.72,
              }}
            />
          ))}
        </View>
        <Text style={{ color: "#d4d4d8", marginTop: 8 }}>
          {callState === "error"
            ? errorMessage
            : t("speakingLanguage", { language })}
        </Text>
        {callState === "success" && session && (
          <View
            style={{
              marginTop: 12,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: session.liveCall ? `${theme.accent}30` : "rgba(255,255,255,0.08)",
              alignSelf: "center",
            }}
          >
            <Text style={{ color: session.liveCall ? "#eafff9" : "#a1a1aa", fontWeight: "900", fontSize: 12 }}>
              {session.liveCall ? t("liveElevenLabsCall") : t("demoCallSession")}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <View style={{ gap: 10 }}>
          {callState === "loading" && (
            <View style={{ alignItems: "center", gap: 12 }}>
              <ActivityIndicator color="#eafff9" />
              <Text style={{ color: "#eafff9", fontWeight: "800" }}>{t("requestingAiCallSession")}</Text>
            </View>
          )}
          {callState !== "loading" && transcript.slice(0, lineCount).map((line, index) => (
            <View
              key={line}
              style={{
                alignSelf: index % 2 === 0 ? "flex-start" : "flex-end",
                maxWidth: "88%",
                backgroundColor:
                  index % 2 === 0 ? `${theme.accent}40` : "rgba(255,255,255,0.08)",
                borderRadius: 18,
                padding: 12,
              }}
            >
              <Text style={{ color: "#eafff9", lineHeight: 20 }}>{line}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: 12, marginTop: 12 }}>
        {callState === "error" && (
          <PrimaryButton
            icon="phone"
            label={t("retryCall")}
            onPress={() => {
              setCallState("loading");
              setErrorMessage("");
              setSession(null);
              setStage(0);
              setLineCount(1);
              initiateCall({
                providerId: params.providerId ?? demoData.providers[0].id,
                patientId: userId ?? demoData.patient.id,
                patientName,
                language,
                summaryId: demoData.healthSummary.id,
              })
                .then((response) => {
                  setSession(response);
                  setCallState("success");
                })
                .catch((error) => {
        setCallState("error");
        setErrorMessage(error instanceof Error ? error.message : t("callFailedConnection"));
      });
    }}
    tone={theme.accent}
          />
        )}
        {callState === "success" && stage === stages.length - 1 && (
          <PrimaryButton
            icon="check"
            label={t("viewConfirmation")}
            onPress={() => router.replace(`/(patient)/confirmation?callSessionId=${session?.callSessionId ?? ""}`)}
            tone="#2f855a"
          />
        )}
      </View>
    </View>
  );
}
