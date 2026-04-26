import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  demoData,
  type AppointmentResponse,
  type SummaryHistoryItem,
} from "@aida/shared";
import { AppointmentDetailSheet } from "../../components/AppointmentDetailSheet";
import { listAppointments, listSummaries } from "../../lib/api";
import { buildDemoActiveAppointment } from "../../lib/demo-appointment";
import { isNonCancelled, matchesAppointmentSearch } from "../../lib/appointment-filters";
import { Card, Field, Icon, Pill, Screen, colors, useAidaTheme } from "../../components/aida";

export default function HistoryScreen() {
  const { theme, userId, language, patientProfile, t } = useAidaTheme();
  const [summaryState, setSummaryState] = useState<"loading" | "success" | "error">("loading");
  const [apptState, setApptState] = useState<"loading" | "success" | "error">("loading");
  const [summaries, setSummaries] = useState<SummaryHistoryItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sheetAppt, setSheetAppt] = useState<AppointmentResponse | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const patientId = userId ?? demoData.patient.id;
  const patientName = `${patientProfile.firstName} ${patientProfile.lastName}`.trim();
  const demoAppt = useMemo(() => buildDemoActiveAppointment(patientId), [patientId]);

  const fallbackSummaries = useMemo<SummaryHistoryItem[]>(
    () => [
      {
        summaryId: demoData.healthSummary.id,
        patientId,
        uploadId: "upload-elena-2026-04-25",
        specialtyRecommendation: demoData.selectedAppointment.visitType,
        urgency: "soon",
        summary: demoData.healthSummary.approvedSummary
          .replace(/Elena Morales/g, patientName)
          .replace(/Elena/g, patientProfile.firstName)
          .replace(/Spanish/g, language),
        shareItems: [
          t("approvedClinicianSummary"),
          `${demoData.insurance.carrier} ${demoData.insurance.plan} insurance details`,
          t("preferredLanguageLabel", { language }),
        ],
        biometricHighlights: [],
        createdAt: demoData.patient.createdAt,
        source: "demo",
        approvedByPatient: true,
      },
    ],
    [language, patientId, patientName, patientProfile.firstName, t],
  );

  const loadAppointments = useCallback(() => {
    listAppointments(patientId)
      .then((response) => {
        setAppointments(response.items);
        setApptState("success");
      })
      .catch(() => {
        setApptState("error");
      });
  }, [patientId]);

  useEffect(() => {
    let mounted = true;

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
        setErrorMessage(error instanceof Error ? error.message : t("unableToLoadSummaryHistory"));
      });

    return () => {
      mounted = false;
    };
  }, [fallbackSummaries, patientId, t]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments]),
  );

  const hasRealAppointments = apptState === "success" && appointments.length > 0;

  const activeList = useMemo(
    () => appointments.filter(isNonCancelled),
    [appointments],
  );

  const visibleActive = useMemo(
    () => activeList.filter((a) => matchesAppointmentSearch(a, search)),
    [activeList, search],
  );

  const showDemoWhenEmpty = apptState === "success" && !hasRealAppointments;
  const showDemoInList = showDemoWhenEmpty && matchesAppointmentSearch(demoAppt, search);

  return (
    <>
    <Screen
      title={t("history")}
      subtitle={t("historySubtitle")}
    >
      <View style={{ gap: 14, paddingBottom: 86 }}>
        <Card>
          <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900", marginBottom: 10 }}>
            {t("appointmentsSection")}
          </Text>
          {hasRealAppointments || showDemoWhenEmpty ? (
            <Field
              label={t("searchAppointments")}
              value={search}
              onChangeText={setSearch}
              placeholder={t("searchAppointments")}
            />
          ) : apptState === "loading" ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: 8 }} />
          ) : null}
        </Card>

        {hasRealAppointments && activeList.length === 0 ? (
          <Text style={{ color: theme.muted, paddingHorizontal: 4 }}>{t("noActiveAppointments")}</Text>
        ) : hasRealAppointments && visibleActive.length === 0 && search.trim() ? (
          <Text style={{ color: theme.muted, paddingHorizontal: 4 }}>{t("noAppointmentsMatch")}</Text>
        ) : null}

        {hasRealAppointments
          ? visibleActive.map((appt) => (
            <Pressable
              key={appt.appointmentId}
              onPress={() => {
                setSheetAppt(appt);
                setSheetOpen(true);
              }}
            >
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.ink, fontSize: 18, fontWeight: "900" }}>
                      {appt.clinicName}
                    </Text>
                    <Text style={{ color: theme.muted, marginTop: 4 }}>
                      {formatAppointmentTime(appt.scheduledAt)}
                    </Text>
                  </View>
                  <Pill label={appt.status} icon="calendar-clock" />
                </View>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  <Pill label={appt.doctor} icon="doctor" tone={colors.plum} />
                  <Pill label={appt.specialty} icon="stethoscope" tone={colors.amber} />
                </View>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 10 }}>
                  {t("tapForDetails")}
                </Text>
              </Card>
            </Pressable>
          ))
          : null}

        {showDemoInList && (
          <Pressable
            onPress={() => {
              setSheetAppt(demoAppt);
              setSheetOpen(true);
            }}
          >
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
              <Text style={{ color: theme.muted, fontSize: 12, marginTop: 10 }}>{t("tapForDetails")}</Text>
            </Card>
          </Pressable>
        )}

        {showDemoWhenEmpty && !showDemoInList && search.trim() ? (
          <Text style={{ color: theme.muted, paddingHorizontal: 4 }}>{t("noAppointmentsMatch")}</Text>
        ) : null}

        {/* Summaries section */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Icon name="brain" size={23} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900" }}>{t("aiHealthSummaries")}</Text>
              <Text style={{ color: theme.muted, marginTop: 3 }}>
                {t("previousGeminiSummaries")}
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
                {t("showingDemoSummaries", { error: errorMessage })}
              </Text>
            </View>
          )}

          {summaries.map((item, index) => (
            <SummaryRow key={item.summaryId} item={item} first={index === 0} />
          ))}
        </Card>

        {!hasRealAppointments && apptState === "success" && showDemoWhenEmpty && (
          <Card>
            <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900" }}>{t("pastVisits")}</Text>
            {demoData.appointmentHistory.slice(1).map((item, index) => (
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
            ))}
          </Card>
        )}
      </View>
    </Screen>
    <AppointmentDetailSheet
      visible={sheetOpen}
      onClose={() => {
        setSheetOpen(false);
        setSheetAppt(null);
      }}
      appointment={sheetAppt}
      patientId={patientId}
      allowCancel={
        !showDemoWhenEmpty || (sheetAppt != null && sheetAppt.appointmentId !== demoAppt.appointmentId)
      }
      onCancelled={loadAppointments}
    />
    </>
  );
}

function SummaryRow({
  item,
  first,
}: {
  item: SummaryHistoryItem;
  first: boolean;
}) {
  const { theme, t } = useAidaTheme();
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
            <Pill label={formatSummaryDate(item.createdAt, t("savedSummary"))} icon="calendar" tone={colors.plum} />
            <Pill label={item.specialtyRecommendation} icon="stethoscope" tone={colors.amber} />
            <Pill
              label={item.approvedByPatient ? t("approved") : t("draft")}
              icon={item.approvedByPatient ? "check" : "pencil"}
              tone={item.approvedByPatient ? colors.green : theme.faint}
            />
          </View>
          <Text style={{ color: theme.ink, fontWeight: "900", lineHeight: 20 }}>
            {item.urgency === "urgent" ? t("urgentReview") : item.urgency === "soon" ? t("reviewSoon") : t("routineReview")}
          </Text>
          <Text style={{ color: theme.muted, lineHeight: 21, marginTop: 6 }}>
            {item.summary}
          </Text>
        </View>
      </View>
    </View>
  );
}

function formatSummaryDate(value: string, fallback: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatAppointmentTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
