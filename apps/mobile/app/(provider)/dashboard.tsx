import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { demoData, type AppointmentResponse } from "@aida/shared";
import { listAppointments } from "../../lib/api";
import {
  Card,
  Icon,
  Pill,
  PrimaryButton,
  Screen,
  colors,
  useAidaTheme,
} from "../../components/aida";

export default function ProviderDashboardScreen() {
  const { theme, language, patientProfile, userId, t } = useAidaTheme();
  const patientName = `${patientProfile.firstName} ${patientProfile.lastName}`.trim();
  const patientId = userId ?? demoData.patient.id;

  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    listAppointments(patientId)
      .then((response) => {
        if (!mounted) return;
        setAppointments(response.items);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [patientId]);

  const hasRealAppts = appointments.length > 0;
  const nextAppt = appointments.find((a) => a.status === "confirmed" || a.status === "pending");
  const visitsToday = hasRealAppts ? appointments.length : demoData.providerIntake.visitsToday;
  const aiBooked = hasRealAppts
    ? appointments.filter((a) => a.status === "confirmed").length
    : demoData.providerIntake.aiBookedNeedingReview;

  return (
    <Screen title={t("today")} subtitle={t("providerQueueSubtitle", { clinic: demoData.providers[0].name })}>
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card style={{ backgroundColor: theme.accent }}>
          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginVertical: 12 }} />
          ) : (
            <>
              <Text style={{ color: "#fff", fontSize: 36, fontFamily: "Georgia", fontWeight: "700" }}>
                {visitsToday}
              </Text>
              <Text style={{ color: "#fff", fontWeight: "900", marginTop: 4 }}>
                {t("visitsToday")}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.82)", lineHeight: 20, marginTop: 8 }}>
                {t("aiBookedNeedsReview", {
                  count: aiBooked,
                  suffix: aiBooked === 1 ? "" : "s",
                  verbSuffix: aiBooked === 1 ? "s" : "",
                })}
              </Text>
            </>
          )}
        </Card>

        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 18, fontWeight: "900" }}>
                {nextAppt?.doctor ? `${patientName} with ${nextAppt.doctor}` : patientName}
              </Text>
              <Text style={{ color: theme.muted, marginTop: 4 }}>
                {nextAppt
                  ? `${formatApptTime(nextAppt.scheduledAt)} - ${nextAppt.specialty}`
                  : `${demoData.selectedAppointment.timeLabel} - ${demoData.selectedAppointment.visitType}`}
              </Text>
            </View>
            <Pill label={t("aiBooked")} icon="creation" />
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <Pill label={language} icon="translate" tone={colors.plum} />
            <Pill label={demoData.insurance.carrier} icon="shield-check" tone={colors.green} />
            <Pill label={t("vitalsFlagged")} icon="heart-pulse" tone={colors.amber} />
          </View>
          <View style={{ marginTop: 16 }}>
            <PrimaryButton href="/(provider)/patients" icon="file-document-check" label={t("reviewIntake")} />
          </View>
        </Card>

        <Card>
          <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>
            {t("pendingConfirmations")}
          </Text>
          {hasRealAppts ? (
            appointments
              .filter((a) => a.status === "pending")
              .map((appt) => (
                <ProviderRow
                  key={appt.appointmentId}
                  name={appt.doctor}
                  detail={`${formatApptTime(appt.scheduledAt)} - ${appt.specialty}`}
                />
              ))
          ) : (
            demoData.providerIntake.pendingConfirmations.map((confirmation) => (
              <ProviderRow key={confirmation.name} name={confirmation.name} detail={confirmation.detail} />
            ))
          )}
          {hasRealAppts && appointments.filter((a) => a.status === "pending").length === 0 && (
            <Text style={{ color: theme.muted, fontWeight: "700" }}>
              {t("allAppointmentsConfirmed")}
            </Text>
          )}
        </Card>
      </View>
    </Screen>
  );
}

function ProviderRow({ name, detail }: { name: string; detail: string }) {
  const { theme } = useAidaTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
      <Icon name="account-heart" color={theme.accent} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.ink, fontWeight: "900" }}>{name}</Text>
        <Text style={{ color: theme.muted, marginTop: 2 }}>{detail}</Text>
      </View>
      <Icon name="chevron-right" color={theme.faint} />
    </View>
  );
}

function formatApptTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
