import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { demoData, type CallSessionResponse } from "@aida/shared";
import { initiateCall } from "../../lib/api";
import { Icon, PrimaryButton, colors, useAidaTheme } from "../../components/aida";

export default function CallStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ providerId?: string }>();
  const { language } = useAidaTheme();
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
      patientId: demoData.patient.id,
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
        setErrorMessage(error instanceof Error ? error.message : "Unable to start the mocked call.");
      });

    return () => {
      mounted = false;
    };
  }, [params.providerId]);

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
        justifyContent: "space-between",
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
          {callState === "loading" ? "Starting call" : callState === "error" ? "Call paused" : stages[stage]}
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
                backgroundColor: colors.teal,
                opacity: 0.72,
              }}
            />
          ))}
        </View>
        <Text style={{ color: "#d4d4d8", marginTop: 8 }}>
          {callState === "error"
            ? errorMessage
            : `Speaking English to the clinic, updating you in ${language}.`}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {callState === "loading" && (
          <View style={{ alignItems: "center", gap: 12 }}>
            <ActivityIndicator color="#eafff9" />
            <Text style={{ color: "#eafff9", fontWeight: "800" }}>Requesting AI call session...</Text>
          </View>
        )}
        {callState !== "loading" && transcript.slice(0, lineCount).map((line, index) => (
          <View
            key={line}
            style={{
              alignSelf: index % 2 === 0 ? "flex-start" : "flex-end",
              maxWidth: "88%",
              backgroundColor:
                index % 2 === 0 ? "rgba(15,118,110,0.28)" : "rgba(255,255,255,0.08)",
              borderRadius: 18,
              padding: 12,
            }}
          >
            <Text style={{ color: "#eafff9", lineHeight: 20 }}>{line}</Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 12, paddingBottom: 20 }}>
        {callState === "error" && (
          <PrimaryButton
            icon="phone"
            label="Retry call"
            onPress={() => {
              setCallState("loading");
              setErrorMessage("");
              setSession(null);
              setStage(0);
              setLineCount(1);
              initiateCall({
                providerId: params.providerId ?? demoData.providers[0].id,
                patientId: demoData.patient.id,
                summaryId: demoData.healthSummary.id,
              })
                .then((response) => {
                  setSession(response);
                  setCallState("success");
                })
                .catch((error) => {
                  setCallState("error");
                  setErrorMessage(error instanceof Error ? error.message : "Unable to start the mocked call.");
                });
            }}
            tone={colors.teal}
          />
        )}
        {callState === "success" && stage === stages.length - 1 && (
          <PrimaryButton
            icon="check"
            label="View confirmation"
            onPress={() => router.replace(`/(patient)/confirmation?callSessionId=${session?.callSessionId ?? ""}`)}
            tone="#2f855a"
          />
        )}
        <View style={{ alignItems: "center" }}>
          <Icon name="phone-in-talk" size={28} color="#eafff9" />
        </View>
      </View>
    </View>
  );
}
