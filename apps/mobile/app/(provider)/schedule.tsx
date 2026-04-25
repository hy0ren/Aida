import { Text, View } from "react-native";
import { Card, Icon, Pill, Screen, SecondaryButton, colors } from "../../components/aida";

export default function ScheduleManagementScreen() {
  return (
    <Screen title="Schedule" subtitle="Slots available to the appointment agent.">
      <View style={{ gap: 14 }}>
        {["Wed 2:30 PM", "Thu 9:00 AM", "Fri 11:00 AM"].map((slot) => (
          <Card key={slot}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Icon name="calendar-clock" size={24} color={colors.teal} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "900" }}>
                  {slot}
                </Text>
                <Text style={{ color: colors.muted, marginTop: 3 }}>
                  Bayview Family Medicine
                </Text>
              </View>
              <Pill label="Open" />
            </View>
          </Card>
        ))}
        <SecondaryButton href="/(provider)/dashboard" icon="arrow-left" label="Back to dashboard" />
      </View>
    </Screen>
  );
}
