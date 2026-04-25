import { Pressable, Text, View } from "react-native";
import { Card, Icon, Pill, Screen, colors, useAidaTheme } from "../../components/aida";

const slots = [
  { time: "Wed 2:30 PM", status: "Booked", patient: "Maria Rivera" },
  { time: "Thu 9:00 AM", status: "Open", patient: "Available for agent" },
  { time: "Fri 11:00 AM", status: "Open", patient: "Available for agent" },
  { time: "Mon 1:15 PM", status: "Held", patient: "Manual review" },
];

export default function ScheduleManagementScreen() {
  const { theme } = useAidaTheme();
  return (
    <Screen title="Schedule" subtitle="Slots the appointment agent can query.">
      <View style={{ gap: 14, paddingBottom: 86 }}>
        <Card>
          <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>
            Availability rules
          </Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Pill label="English calls" icon="phone" />
            <Pill label="Aetna accepted" icon="shield-check" tone={colors.green} />
            <Pill label="15 min buffer" icon="timer-outline" tone={colors.plum} />
          </View>
        </Card>

        {slots.map((slot) => (
          <Pressable key={slot.time}>
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Icon name="calendar-clock" size={24} color={theme.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900" }}>
                    {slot.time}
                  </Text>
                  <Text style={{ color: theme.muted, marginTop: 3 }}>{slot.patient}</Text>
                </View>
                <Pill
                  label={slot.status}
                  tone={slot.status === "Open" ? colors.green : slot.status === "Held" ? colors.amber : theme.accent}
                />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
