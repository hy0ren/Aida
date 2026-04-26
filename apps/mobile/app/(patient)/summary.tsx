import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { demoData } from "@aida/shared";
import type { DemoBiometricMetric } from "@aida/shared";
import { summarizeUpload } from "../../lib/api";
import { loadSyncedHealth } from "../../lib/synced-health-data";
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
  const { theme, language, userId, patientProfile, t } = useAidaTheme();
  const patientName = `${patientProfile.firstName} ${patientProfile.lastName}`.trim();
  const personalizedSampleSummary = sampleSummary
    .replace(/Elena Morales/g, patientName)
    .replace(/Elena/g, patientProfile.firstName)
    .replace(/Spanish/g, language);
  const [summary, setSummary] = useState(personalizedSampleSummary);
  const [summaryState, setSummaryState] = useState<"loading" | "success" | "error">("loading");
  const [statusMessage, setStatusMessage] = useState(t("summaryLoadingMessage"));
  const [shareItems, setShareItems] = useState([
    t("approvedSummary"),
    t("insuranceDetails"),
    t("preferredLanguageLabel", { language }),
    demoData.selectedAppointment.reason,
  ]);
  const [flaggedPair, setFlaggedPair] = useState<[DemoBiometricMetric, DemoBiometricMetric] | null>(null);

  const loadFlaggedFromStore = useCallback(() => {
    loadSyncedHealth().then((h) => {
      if (!h?.metrics.length) {
        setFlaggedPair(null);
        return;
      }
      const attention = h.metrics.filter((m) => m.status === "attention");
      let first: DemoBiometricMetric;
      let second: DemoBiometricMetric;
      if (attention.length >= 2) {
        first = attention[0]!;
        second = attention[1]!;
      } else if (attention.length === 1) {
        first = attention[0]!;
        second = h.metrics.find((m) => m.id !== first.id) ?? h.metrics[0]!;
      } else {
        first = h.metrics[0]!;
        second = h.metrics[1] ?? h.metrics[0]!;
      }
      setFlaggedPair([first, second]);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFlaggedFromStore();
    }, [loadFlaggedFromStore]),
  );

  useEffect(() => {
    let mounted = true;

    summarizeUpload({
      uploadId: "upload-current",
      patientId: userId ?? demoData.patient.id,
      patientName,
      language,
    })
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
        setStatusMessage(error instanceof Error ? error.message : t("summaryFailed"));
      });

    return () => {
      mounted = false;
    };
  }, [language, patientName, userId]);

  return (
    <Screen
      title={t("reviewSummary")}
      subtitle={t("reviewSummarySubtitle")}
      action={<Pill label={`${language} + Gemini`} icon="translate" />}
    >
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card style={{ backgroundColor: theme.surface }}>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            <Pill label={t("rawDataStayedLocal")} icon="shield-check" tone={colors.green} />
            <Pill label={t("patientApprovalRequired")} icon="account-check" tone={theme.accent} />
            <Pill label={t("clinicReady")} icon="file-document-check" tone={colors.plum} />
          </View>
        </Card>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <MetricCard
            icon="heart"
            label={flaggedPair?.[0].shortLabel ?? "—"}
            value={flaggedPair?.[0].value ?? "—"}
            detail={flaggedPair?.[0].summaryDetail ?? t("noBiometricsDetail")}
            flagged
          />
          <MetricCard
            icon="sleep"
            label={flaggedPair?.[1].shortLabel ?? "—"}
            value={flaggedPair?.[1].value ?? "—"}
            detail={flaggedPair?.[1].summaryDetail ?? t("noBiometricsDetail")}
            flagged
          />
        </View>

        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>{t("summaryForDoctor")}</Text>
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
            {t("editableSummaryHint")}
          </Text>
        </Card>

        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>{t("whatWillBeShared")}</Text>
          <View style={{ gap: 8 }}>
            {shareItems.map((item, index) => (
              <Pill
                key={item}
                label={item.replace(/Spanish/g, language)}
                icon={index === 0 ? "check" : index === 1 ? "card-account-details" : index === 2 ? "translate" : "stethoscope"}
                tone={index === 1 ? colors.plum : index === 2 ? colors.amber : index === 3 ? colors.green : undefined}
              />
            ))}
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          <PrimaryButton href="/(patient)/book" icon="check" label={t("approveAndContinue")} />
          <SecondaryButton href="/(patient)/upload" icon="pencil" label={t("editUploads")} />
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
  const { theme, t } = useAidaTheme();
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
          label={state === "success" ? t("ready") : t("error")}
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
