import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { demoData, type AppointmentResponse } from "@aida/shared";
import { AppointmentDetailSheet } from "../../components/AppointmentDetailSheet";
import { listAppointments } from "../../lib/api";
import { matchesAppointmentSearch } from "../../lib/appointment-filters";
import { Card, Field, Icon, Pill, Screen, colors, useAidaTheme } from "../../components/aida";

function isCancelled(a: AppointmentResponse): boolean {
  return a.status === "cancelled";
}

export default function CancelledAppointmentsScreen() {
  const router = useRouter();
  const { theme, userId, t } = useAidaTheme();
  const patientId = userId ?? demoData.patient.id;
  const [state, setState] = useState<"loading" | "ready">("loading");
  const [items, setItems] = useState<AppointmentResponse[]>([]);
  const [search, setSearch] = useState("");
  const [sheetAppt, setSheetAppt] = useState<AppointmentResponse | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(() => {
    setState("loading");
    listAppointments(patientId)
      .then((r) => {
        setItems(r.items);
        setState("ready");
      })
      .catch(() => {
        setItems([]);
        setState("ready");
      });
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const cancelled = useMemo(
    () => items.filter(isCancelled).filter((a) => matchesAppointmentSearch(a, search)),
    [items, search],
  );

  return (
    <>
    <Screen
      title={t("cancelledAppointments")}
      subtitle={t("cancelledAppointmentsSubtitle")}
      action={
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 8 })}
          hitSlop={8}
        >
          <Icon name="close" size={26} color={theme.ink} />
        </Pressable>
      }
    >
      <View style={{ gap: 14, paddingBottom: 86 }}>
        <Card>
          <Field
            label={t("searchAppointments")}
            value={search}
            onChangeText={setSearch}
            placeholder={t("searchAppointments")}
          />
        </Card>

        {state === "loading" && items.length === 0 ? (
          <ActivityIndicator color={theme.accent} />
        ) : cancelled.length === 0 ? (
          <Text style={{ color: theme.muted, paddingHorizontal: 4 }}>
            {search.trim() ? t("noAppointmentsMatch") : t("noCancelledAppointments")}
          </Text>
        ) : (
          cancelled.map((appt) => (
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
                    <Text style={{ color: theme.ink, fontSize: 18, fontWeight: "900" }}>{appt.clinicName}</Text>
                    <Text style={{ color: theme.muted, marginTop: 4 }}>{formatAppointmentTime(appt.scheduledAt)}</Text>
                  </View>
                  <Pill label={appt.status} icon="calendar-remove" />
                </View>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  <Pill label={appt.doctor} icon="doctor" tone={colors.plum} />
                  <Pill label={appt.specialty} icon="stethoscope" tone={colors.amber} />
                </View>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 10 }}>{t("tapForDetails")}</Text>
              </Card>
            </Pressable>
          ))
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
      allowCancel
      onCancelled={load}
    />
    </>
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
