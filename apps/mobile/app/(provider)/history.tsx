import { Text, View } from "react-native";
import { Card, Icon, Pill, Screen, colors, useAidaTheme } from "../../components/aida";

const visits = [
  ["Maria Rivera", "AI-booked intake", "Wed 2:30 PM"],
  ["Jae Kim", "Cardiology consult", "Thu 9:00 AM"],
  ["Sofia Alvarez", "Follow-up", "Fri 11:00 AM"],
  ["Noah Patel", "Lab review", "Completed"],
];

export default function ProviderHistoryScreen() {
  const { theme } = useAidaTheme();
  return (
    <Screen title="History" subtitle="Recent provider-side appointment activity.">
      <View style={{ gap: 14, paddingBottom: 86 }}>
        {visits.map(([name, reason, status], index) => (
          <Card key={`${name}-${reason}`}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Icon name="clipboard-text-clock-outline" size={24} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900" }}>{name}</Text>
                <Text style={{ color: theme.muted, marginTop: 3 }}>{reason}</Text>
              </View>
              <Pill label={status} tone={index === 0 ? theme.accent : colors.faint} />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
