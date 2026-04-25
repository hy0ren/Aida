import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { demoData } from "@aida/shared";
import { summarizeUpload } from "../../lib/api";
import {
  Card,
  MetricCard,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
  colors,
  sampleSummary,
  useAidaTheme,
} from "../../components/aida";

export default function SummaryScreen() {
  const [summary, setSummary] = useState(sampleSummary);
  const [summaryState, setSummaryState] = useState<"loading" | "success" | "error">("loading");
  const [statusMessage, setStatusMessage] = useState("Gemini is summarizing on-device cleaned biometrics in your language.");
  const [shareItems, setShareItems] = useState([
    "Approved summary",
    "Insurance details",
    `Preferred language: ${demoData.patient.preferredLanguage.label}`,
    demoData.selectedAppointment.reason,
  ]);
  const { theme, language } = useAidaTheme();
  const flaggedMetrics = demoData.biometricMetrics.filter((metric) => metric.status === "attention");

  useEffect(() => {
    let mounted = true;

    summarizeUpload({ uploadId: "upload-elena-2026-04-25", patientId: demoData.patient.id, language })
      .then((response) => {
        if (!mounted) return;
        setSummary(response.summary);
        setShareItems(response.shareItems);
        setSummaryState("success");
        setStatusMessage(`${response.specialtyRecommendation} recommended. Urgency: ${response.urgency}.`);
      })
      .catch((error) => {
        if (!mounted) return;
        setSummaryState("error");
        setStatusMessage(error instanceof Error ? error.message : "Summary failed. Please try again.");
      });

    return () => {
      mounted = false;
    };
  }, [language]);

  return (
    <Screen
      title="Review summary"
      subtitle="Nothing is sent to a clinic until you approve it."
      action={<Pill label={`${language} + Gemini`} icon="translate" />}
    >
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card style={{ backgroundColor: theme.surface }}>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            <Pill label="Raw data stayed local" icon="shield-check" tone={colors.green} />
            <Pill label="Patient approval required" icon="account-check" tone={theme.accent} />
            <Pill label="Clinic-ready" icon="file-document-check" tone={colors.plum} />
          </View>
        </Card>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <MetricCard
            icon="heart"
            label={flaggedMetrics[0].shortLabel}
            value={flaggedMetrics[0].value}
            detail={flaggedMetrics[0].summaryDetail}
            flagged
          />
          <MetricCard
            icon="sleep"
            label={flaggedMetrics[1].shortLabel}
            value={flaggedMetrics[1].value}
            detail={flaggedMetrics[1].summaryDetail}
            flagged
          />
        </View>

        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>Summary for your doctor</Text>
          <ApiStatus state={summaryState} message={statusMessage} />
          <TextInput
            multiline
            value={summary}
            onChangeText={setSummary}
            style={{
              minHeight: 170,
              color: theme.ink,
              fontSize: 15,
              lineHeight: 23,
              textAlignVertical: "top",
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 14,
            }}
          />
          <Text style={{ color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 10 }}>
            You can edit this before it is attached to the appointment request.
          </Text>
        </Card>

        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>What will be shared</Text>
          <View style={{ gap: 8 }}>
            {shareItems.map((item, index) => (
              <Pill
                key={item}
                label={item.replace(demoData.patient.preferredLanguage.label, language)}
                icon={index === 0 ? "check" : index === 1 ? "card-account-details" : index === 2 ? "translate" : "stethoscope"}
                tone={index === 1 ? colors.plum : index === 2 ? colors.amber : index === 3 ? colors.green : undefined}
              />
            ))}
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          <PrimaryButton href="/(patient)/book" icon="check" label="Approve and continue" />
          <SecondaryButton href="/(patient)/upload" icon="pencil" label="Edit uploads" />
        </View>
      </View>
    </Screen>
  );
}

function ApiStatus({
  state,
  message,
}: {
  state: "loading" | "success" | "error";
  message: string;
}) {
  const { theme } = useAidaTheme();
  const tone = state === "success" ? colors.green : state === "error" ? colors.red : theme.accent;

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        backgroundColor: `${tone}10`,
        borderRadius: 14,
        padding: 10,
        marginBottom: 12,
      }}
    >
      {state === "loading" ? (
        <ActivityIndicator color={tone} />
      ) : (
        <Pill
          label={state === "success" ? "Ready" : "Error"}
          icon={state === "success" ? "check" : "alert-circle-outline"}
          tone={tone}
        />
      )}
      <Text style={{ color: theme.ink, flex: 1, fontSize: 13, fontWeight: "700", lineHeight: 18 }}>
        {message}
      </Text>
    </View>
  );
}

const sectionTitle = {
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 12,
};
