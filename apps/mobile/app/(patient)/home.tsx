import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import {
  demoData,
  type AppointmentResponse,
  type SummaryHistoryItem,
} from "@aida/shared";
import { listAppointments, listSummaries } from "../../lib/api";
import {
  Card,
  Icon,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
  colors,
  fonts,
  useAidaTheme,
} from "../../components/aida";
import type { ComponentProps } from "react";

type MetricTone = "attention" | "stable";
type MetricIcon = ComponentProps<typeof Icon>["name"];

const METRIC_ICON_MAP: Record<string, MetricIcon> = {
  "resting-heart-rate": "heart-pulse",
  "sleep-score": "sleep",
  "heart-rate-variability": "chart-bell-curve",
  steps: "shoe-print",
};

const todaysMetrics: {
  icon: MetricIcon;
  label: string;
  value: string;
  unit?: string;
  detail: string;
  tone: MetricTone;
  wide?: boolean;
}[] = demoData.biometricMetrics.map((metric) => ({
  icon: METRIC_ICON_MAP[metric.id] ?? "lungs",
  label: metric.label,
  value: metric.value,
  unit: metric.unit,
  detail: metric.detail,
  tone: metric.status,
  wide: metric.wide,
}));

export default function HomeScreen() {
  const { theme, mode, language, userId, patientProfile, t } = useAidaTheme();
  const patientId = userId ?? demoData.patient.id;

  const [nextAppt, setNextAppt] = useState<AppointmentResponse | null>(null);
  const [latestSummary, setLatestSummary] = useState<SummaryHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      listAppointments(patientId),
      listSummaries(patientId),
    ]).then(([apptResult, summaryResult]) => {
      if (!mounted) return;
      if (apptResult.status === "fulfilled" && apptResult.value.items.length > 0) {
        const upcoming = apptResult.value.items.find(
          (a) => a.status === "confirmed" || a.status === "pending",
        );
        setNextAppt(upcoming ?? apptResult.value.items[0]);
      }
      if (summaryResult.status === "fulfilled" && summaryResult.value.items.length > 0) {
        setLatestSummary(summaryResult.value.items[0]);
      }
      setLoading(false);
    });

    return () => { mounted = false; };
  }, [patientId]);

  const headline = latestSummary
    ? `${latestSummary.specialtyRecommendation} — ${latestSummary.urgency}`
    : demoData.healthSummary.headline;
  const detail = latestSummary?.summary?.slice(0, 120)
    ? `${latestSummary.summary.slice(0, 120)}...`
    : demoData.healthSummary.detail;
  const syncLabel = latestSummary
    ? formatRelative(latestSummary.createdAt)
    : demoData.healthSummary.lastSyncLabel;

  const apptDoctor = nextAppt?.doctor ?? demoData.providers[0].doctor;
  const apptTime = nextAppt
    ? formatAppointmentTime(nextAppt.scheduledAt)
    : demoData.selectedAppointment.displayDateTime;
  const apptStatus = nextAppt?.status ?? demoData.selectedAppointment.status;

  return (
    <Screen
      title={t("biometrics")}
      subtitle={t("morningSubtitle", { name: patientProfile.firstName })}
      action={<Pill label={language} icon="translate" tone={colors.plum} />}
    >
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card style={{ backgroundColor: mode === "dark" ? "#2f3035" : colors.ink }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#b7cbc5", fontSize: 13, fontWeight: "800" }}>
                {t("healthStatus")}
              </Text>
              {loading ? (
                <ActivityIndicator color="#d7fff3" style={{ marginTop: 14 }} />
              ) : (
                <>
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 28,
                      fontWeight: "900",
                      marginTop: 6,
                      lineHeight: 33,
                    }}
                  >
                    {headline}
                  </Text>
                  <Text style={{ color: "#d9e6e2", fontSize: 14, lineHeight: 21, marginTop: 8 }}>
                    {detail}
                  </Text>
                </>
              )}
            </View>
            <Icon name="heart-pulse" size={44} color="#d7fff3" />
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
            <Pill label={t("lastSync", { value: syncLabel })} icon="sync" tone="#d7fff3" />
            <Pill label={t("onDevice")} icon="shield-check" tone="#d7fff3" />
          </View>
        </Card>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <PrimaryButton href="/(patient)/upload" icon="cloud-upload" label={t("uploadData")} />
          <SecondaryButton href="/(patient)/book" icon="calendar-plus" label={t("book")} />
        </View>

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${theme.accent}14`,
              }}
            >
              <Icon name="calendar-clock" size={22} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[sectionTitle, { color: theme.ink, marginBottom: 4 }]}>
                {t("nextAppointment")}
              </Text>
              <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900" }}>
                {apptDoctor}
              </Text>
              <Text style={{ color: theme.muted, marginTop: 4 }}>{apptTime}</Text>
            </View>
            <Pill label={apptStatus} icon="check" />
          </View>
        </Card>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[sectionTitle, { color: theme.ink, marginBottom: 4 }]}>
                {t("todaysMetrics")}
              </Text>
              <Text style={{ color: theme.muted, fontSize: 14, lineHeight: 20 }}>
                {t("recentReadings")}
              </Text>
            </View>
            <Pill
              label={t("updatedCount", { count: todaysMetrics.length })}
              icon="sync"
              tone={mode === "dark" ? "#d7fff3" : colors.green}
            />
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {todaysMetrics.map((metric) => (
              <TodayMetricCard key={metric.label} {...metric} />
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}

function TodayMetricCard({
  icon,
  label,
  value,
  unit,
  detail,
  tone,
  wide,
}: (typeof todaysMetrics)[number]) {
  const { theme, mode, t } = useAidaTheme();
  const isFlagged = tone === "attention";
  const accent = isFlagged ? colors.amber : colors.green;
  const softFill = mode === "dark" ? `${accent}24` : `${accent}14`;

  return (
    <Card
      style={{
        width: wide ? "100%" : "48%",
        minHeight: wide ? 128 : 172,
        padding: 16,
        borderColor: isFlagged ? accent : theme.line,
        backgroundColor: isFlagged && mode === "light" ? "#fffaf2" : theme.card,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 13,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: softFill,
          }}
        >
          <Icon name={icon} size={21} color={accent} />
        </View>
        {isFlagged ? (
          <Pill label={t("review")} icon="alert-circle" tone={accent} />
        ) : (
          <Pill label={t("stable")} icon="check-circle" tone={accent} />
        )}
      </View>

      <View style={{ marginTop: wide ? 14 : 18 }}>
        <Text
          style={{
            color: theme.ink,
            fontSize: wide ? 42 : 40,
            lineHeight: wide ? 48 : 45,
            fontWeight: "700",
            fontFamily: fonts.display,
          }}
        >
          {value}
          {unit && (
            <Text
              style={{
                color: theme.muted,
                fontSize: wide ? 18 : 16,
                fontWeight: "800",
                fontFamily: fonts.body,
              }}
            >
              {" "}
              {unit}
            </Text>
          )}
        </Text>
        <Text style={{ color: theme.ink, fontSize: 15, fontWeight: "900", marginTop: 4 }}>
          {label}
        </Text>
        <Text style={{ color: theme.muted, fontSize: 12, lineHeight: 17, marginTop: 6 }}>
          {detail}
        </Text>
      </View>
    </Card>
  );
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

function formatRelative(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "recently";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const sectionTitle = {
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 12,
};
