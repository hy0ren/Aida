import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { demoData, type AppointmentResponse, type SmsResponse } from "@aida/shared";
import { createAppointment, sendAppointmentSms } from "../../lib/api";
import {
  Card,
  Icon,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
  colors,
  useAidaTheme,
} from "../../components/aida";

export default function ConfirmationScreen() {
  const { theme } = useAidaTheme();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [sms, setSms] = useState<SmsResponse | null>(null);
  const preparation = appointment?.preparation ?? ["Bring insurance card and photo ID"];

  useEffect(() => {
    let mounted = true;

    createAppointment({ providerId: demoData.providers[0].id })
      .then(async (appointmentResponse) => {
        const smsResponse = await sendAppointmentSms({
          appointmentId: appointmentResponse.appointmentId,
          patientId: appointmentResponse.patientId,
        });
        if (!mounted) return;
        setAppointment(appointmentResponse);
        setSms(smsResponse);
        setState("success");
      })
      .catch((error) => {
        if (!mounted) return;
        setState("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load confirmation.");
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Screen title="You're booked" subtitle="A confirmation was sent to your phone.">
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <View style={{ alignItems: "center", paddingVertical: 14 }}>
          <View
            style={{
              width: 104,
              height: 104,
              borderRadius: 52,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${colors.green}18`,
            }}
          >
            <Icon name="check" size={56} color={colors.green} />
          </View>
        </View>

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                backgroundColor: `${theme.accent}18`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="doctor" size={28} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 18, fontWeight: "900" }}>
                {appointment?.doctor ?? demoData.providers[0].doctor}
              </Text>
              <Text style={{ color: theme.muted, marginTop: 3 }}>
                {appointment?.specialty ?? demoData.providers[0].specialty}
              </Text>
            </View>
            <Pill label={appointment?.status ?? demoData.selectedAppointment.status} icon="check" />
          </View>

          <View style={{ gap: 12, marginTop: 18 }}>
            <Detail
              icon="calendar"
              text={appointment ? formatAppointmentTime(appointment.scheduledAt) : demoData.selectedAppointment.displayDateTime}
            />
            <Detail icon="hospital-building" text={appointment?.clinicName ?? demoData.providers[0].name} />
            <Detail icon="map-marker" text={appointment?.address ?? demoData.providers[0].address} />
            {preparation.map((item) => (
              <Detail key={item} icon="bag-personal" text={item} />
            ))}
          </View>
        </Card>

        <Card style={{ backgroundColor: theme.surface }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "900" }}>
              SMS RECEIPT
            </Text>
            {state === "loading" && <ActivityIndicator color={theme.accent} />}
            {state === "error" && <Pill label="Error" icon="alert-circle-outline" tone={colors.red} />}
            {state === "success" && <Pill label={sms?.status ?? "sent"} icon="check" tone={colors.green} />}
          </View>
          {state === "error" && (
            <Text style={{ color: colors.red, marginTop: 8, fontWeight: "800" }}>{errorMessage}</Text>
          )}
          <View
            style={{
              marginTop: 10,
              backgroundColor: theme.card,
              borderRadius: 18,
              padding: 14,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: theme.ink, lineHeight: 21 }}>
              {sms?.message ?? demoData.smsReceipt.body}
            </Text>
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          <PrimaryButton href="/(patient)/home" icon="calendar-plus" label="Add to calendar" />
          <SecondaryButton href="/(patient)/home" icon="home" label="Done" />
        </View>
      </View>
    </Screen>
  );
}

function formatAppointmentTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function Detail({ icon, text }: { icon: "calendar" | "hospital-building" | "map-marker" | "bag-personal"; text: string }) {
  const { theme } = useAidaTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Icon name={icon} size={18} color={theme.muted} />
      <Text style={{ color: theme.ink, fontSize: 15, fontWeight: "700", flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}
