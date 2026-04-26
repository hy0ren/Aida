import { Text, View } from "react-native";
import { demoData } from "@aida/shared";
import { Card, Icon, Pill, PrimaryButton, Screen, colors, useAidaTheme } from "../../components/aida";

export default function ProviderDashboardScreen() {
  const { theme, language, patientProfile } = useAidaTheme();
  const patientName = `${patientProfile.firstName} ${patientProfile.lastName}`.trim();
  return (
    <Screen title="Today" subtitle={`${demoData.providers[0].name} appointment queue.`}>
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card style={{ backgroundColor: theme.accent }}>
          <Text style={{ color: "#fff", fontSize: 36, fontFamily: "Georgia", fontWeight: "700" }}>
            {demoData.providerIntake.visitsToday}
          </Text>
          <Text style={{ color: "#fff", fontWeight: "900", marginTop: 4 }}>
            visits today
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.82)", lineHeight: 20, marginTop: 8 }}>
            {demoData.providerIntake.aiBookedNeedingReview} new AI-booked appointment needs intake review.
          </Text>
        </Card>

        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 18, fontWeight: "900" }}>
                {patientName}
              </Text>
              <Text style={{ color: theme.muted, marginTop: 4 }}>
                {demoData.selectedAppointment.timeLabel} - {demoData.selectedAppointment.visitType}
              </Text>
            </View>
            <Pill label="AI booked" icon="creation" />
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <Pill label={language} icon="translate" tone={colors.plum} />
            <Pill label={demoData.insurance.carrier} icon="shield-check" tone={colors.green} />
            <Pill label="Vitals flagged" icon="heart-pulse" tone={colors.amber} />
          </View>
          <View style={{ marginTop: 16 }}>
            <PrimaryButton href="/(provider)/patients" icon="file-document-check" label="Review intake" />
          </View>
        </Card>

        <Card>
          <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>
            Pending confirmations
          </Text>
          {demoData.providerIntake.pendingConfirmations.map((confirmation) => (
            <ProviderRow key={confirmation.name} name={confirmation.name} detail={confirmation.detail} />
          ))}
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
