import { Text, View } from "react-native";
import { demoData } from "@aida/shared";
import { Card, Icon, Pill, Screen, colors, sampleSummary, useAidaTheme } from "../../components/aida";

export default function HistoryScreen() {
  const { theme } = useAidaTheme();
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
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Icon name="file-document-check" size={23} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900" }}>
                Approved biometric summary
              </Text>
              <Text style={{ color: theme.muted, lineHeight: 20, marginTop: 6 }}>
                {sampleSummary}
              </Text>
            </View>
          </View>
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
