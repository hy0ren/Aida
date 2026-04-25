import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Icon, PrimaryButton, colors, useAidaTheme } from "../../components/aida";

const transcript = [
  "Aida: Hi, I am calling on behalf of Maria Rivera to schedule a visit.",
  "Clinic: What insurance and reason for visit?",
  "Aida: Aetna Choice POS II. Elevated resting heart rate and fatigue for three days.",
  "Clinic: Dr. Chen has Wednesday at 2:30 PM.",
  "Aida: That works. Please book it.",
];

export default function CallStatusScreen() {
  const router = useRouter();
  const { language } = useAidaTheme();
  const [stage, setStage] = useState(0);
  const [lineCount, setLineCount] = useState(1);
  const stages = useMemo(
    () => ["Calling clinic", "Connected", "Verifying insurance", "Confirmed"],
    [],
  );

  useEffect(() => {
    if (stage < stages.length - 1) {
      const timer = setTimeout(() => setStage((value) => value + 1), 1400);
      return () => clearTimeout(timer);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [stage, stages.length]);

  useEffect(() => {
    const timer = setInterval(
      () => setLineCount((value) => Math.min(transcript.length, value + 1)),
      900,
    );
    return () => clearInterval(timer);
  }, []);

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
          BAYVIEW FAMILY MEDICINE
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
          {stages[stage]}
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
          Speaking English to the clinic, updating you in {language}.
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {transcript.slice(0, lineCount).map((line, index) => (
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
        {stage === 3 && (
          <PrimaryButton
            icon="check"
            label="View confirmation"
            onPress={() => router.replace("/(patient)/confirmation")}
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
