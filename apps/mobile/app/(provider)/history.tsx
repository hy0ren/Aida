import { useMemo } from "react";
import { Text, View } from "react-native";
import { demoData } from "@aida/shared";
import { Card, Icon, Pill, Screen, colors, useAidaTheme } from "../../components/aida";

export default function ProviderHistoryScreen() {
  const { theme, patientProfile } = useAidaTheme();
  const patientName = `${patientProfile.firstName} ${patientProfile.lastName}`.trim();
  const visits = useMemo(
    () =>
      demoData.appointmentHistory.map((visit, index) =>
        index === 0 ? { ...visit, patientName } : visit,
      ),
    [patientName],
  );
  return (
    <Screen title="History" subtitle="Recent provider-side appointment activity.">
      <View style={{ gap: 14, paddingBottom: 86 }}>
        {visits.map((visit, index) => (
          <Card key={visit.id}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Icon name="clipboard-text-clock-outline" size={24} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900" }}>{visit.patientName}</Text>
                <Text style={{ color: theme.muted, marginTop: 3 }}>{visit.reason}</Text>
              </View>
              <Pill label={visit.dateTime} tone={index === 0 ? theme.accent : colors.faint} />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
