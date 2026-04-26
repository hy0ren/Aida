import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { demoData, type SummaryHistoryItem } from "@aida/shared";
import { listSummaries } from "../../lib/api";
import { Card, Icon, Pill, Screen, colors, useAidaTheme } from "../../components/aida";

export default function HistoryScreen() {
  const { theme, userId } = useAidaTheme();
  const [summaryState, setSummaryState] = useState<"loading" | "success" | "error">("loading");
  const [summaries, setSummaries] = useState<SummaryHistoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const patientId = userId ?? demoData.patient.id;

  const fallbackSummaries = useMemo<SummaryHistoryItem[]>(
    () => [
      {
        summaryId: demoData.healthSummary.id,
        patientId: demoData.patient.id,
        uploadId: "upload-elena-2026-04-25",
        specialtyRecommendation: demoData.selectedAppointment.visitType,
        urgency: "soon",
        summary: demoData.healthSummary.approvedSummary,
        shareItems: [
          "Approved clinician summary",
          `${demoData.insurance.carrier} ${demoData.insurance.plan} insurance details`,
          `Preferred language: ${demoData.patient.preferredLanguage.label}`,
        ],
        biometricHighlights: [],
        createdAt: demoData.patient.createdAt,
        source: "demo",
        approvedByPatient: true,
      },
    ],
    [],
  );

  useEffect(() => {
    let mounted = true;
    setSummaryState("loading");

    listSummaries(patientId)
      .then((response) => {
        if (!mounted) return;
        setSummaries(response.items.length > 0 ? response.items : fallbackSummaries);
        setSummaryState("success");
      })
      .catch((error) => {
        if (!mounted) return;
        setSummaries(fallbackSummaries);
        setSummaryState("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load summary history.");
      });

    return () => {
      mounted = false;
    };
  }, [fallbackSummaries, patientId]);

  return (
    <Screen
      title="History"
      subtitle="Appointments, summaries, and confirmation receipts stay organized here."
    >
      <View style={{ gap: 14, paddingBottom: 86 }}>
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 18, fontWeight: "900" }}>
                {demoData.providers[0].name}
              </Text>
              <Text style={{ color: theme.muted, marginTop: 4 }}>
                {demoData.selectedAppointment.displayDateTime}
              </Text>
            </View>
            <Pill label={demoData.appointmentHistory[0].status} icon="calendar-clock" />
          </View>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <Pill label={demoData.providers[0].doctor} icon="doctor" tone={colors.plum} />
            <Pill label={demoData.selectedAppointment.visitType} icon="stethoscope" tone={colors.amber} />
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Icon name="brain" size={23} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900" }}>AI health summaries</Text>
              <Text style={{ color: theme.muted, marginTop: 3 }}>
                Previous Gemini summaries stored with your patient record.
              </Text>
            </View>
            {summaryState === "loading" && <ActivityIndicator color={theme.accent} />}
          </View>

          {summaryState === "error" && (
            <View
              style={{
                backgroundColor: `${colors.amber}14`,
                borderRadius: 14,
                padding: 10,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: theme.ink, fontSize: 12, fontWeight: "800", lineHeight: 17 }}>
                Showing demo summaries. {errorMessage}
              </Text>
            </View>
          )}

          {summaries.map((item, index) => (
            <SummaryRow key={item.summaryId} item={item} first={index === 0} />
          ))}
        </Card>

        <Card>
          <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900" }}>
            Past visits
          </Text>
          {demoData.appointmentHistory.slice(1).map(
            (item, index) => (
              <View
                key={item.id}
                style={{
                  paddingTop: 14,
                  marginTop: 14,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: theme.line,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon name="clipboard-text-clock-outline" color={theme.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.ink, fontWeight: "800" }}>{item.reason}</Text>
                  <Text style={{ color: theme.muted, marginTop: 2 }}>{item.status}</Text>
                </View>
                <Icon name="chevron-right" color={theme.faint} />
              </View>
            ),
          )}
        </Card>
      </View>
    </Screen>
  );
}

function SummaryRow({
  item,
  first,
}: {
  item: SummaryHistoryItem;
  first: boolean;
}) {
  const { theme } = useAidaTheme();
  return (
    <View
      style={{
        paddingTop: first ? 0 : 14,
        marginTop: first ? 0 : 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: theme.line,
      }}
    >
      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
        <Icon name="file-document-check" size={22} color={theme.accent} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <Pill label={formatSummaryDate(item.createdAt)} icon="calendar" tone={colors.plum} />
            <Pill label={item.specialtyRecommendation} icon="stethoscope" tone={colors.amber} />
            <Pill
              label={item.approvedByPatient ? "Approved" : "Draft"}
              icon={item.approvedByPatient ? "check" : "pencil"}
              tone={item.approvedByPatient ? colors.green : theme.faint}
            />
          </View>
          <Text style={{ color: theme.ink, fontWeight: "900", lineHeight: 20 }}>
            {item.urgency === "urgent" ? "Urgent review" : item.urgency === "soon" ? "Review soon" : "Routine review"}
          </Text>
          <Text style={{ color: theme.muted, lineHeight: 21, marginTop: 6 }}>
            {item.summary}
          </Text>
        </View>
      </View>
    </View>
  );
}

function formatSummaryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved summary";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
