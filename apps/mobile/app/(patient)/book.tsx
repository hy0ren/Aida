import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { demoData } from "@aida/shared";
import {
  Card,
  Icon,
  Pill,
  PrimaryButton,
  Screen,
  colors,
  clinics,
  useAidaTheme,
} from "../../components/aida";

export default function BookScreen() {
  const [selected, setSelected] = useState(0);
  const { theme } = useAidaTheme();

  return (
    <Screen
      title="Schedule"
      subtitle="Aida found clinics based on your approved summary, location, and insurance."
    >
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card style={{ backgroundColor: theme.surface }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Icon name="alert-circle-outline" size={24} color={colors.amber} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900" }}>
                Suggested visit
              </Text>
              <Text style={{ color: theme.muted, lineHeight: 20, marginTop: 4 }}>
                {demoData.healthSummary.suggestedVisit}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>Insurance check</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Pill label={demoData.insurance.detectedLabel} icon="card-account-details" />
            <Pill label={demoData.insurance.estimatedCopay} icon="cash" tone={colors.green} />
            <Pill label={demoData.insurance.networkStatus} icon="check" tone={theme.accent} />
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          {clinics.map((clinic, index) => {
            const active = selected === index;
            return (
              <Pressable key={clinic.name} onPress={() => setSelected(index)}>
                <Card
                  style={{
                    borderColor: active ? theme.accent : theme.line,
                    borderWidth: active ? 1.5 : 1,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: active ? `${theme.accent}18` : theme.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="hospital-building" size={24} color={active ? theme.accent : theme.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900" }}>
                        {clinic.name}
                      </Text>
                      <Text style={{ color: theme.muted, marginTop: 3 }}>
                        {clinic.doctor}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                        <Pill label={clinic.distance} icon="map-marker" tone={colors.faint} />
                        <Pill label={clinic.network} icon="shield-check" />
                        <Pill label={clinic.next} icon="calendar-clock" tone={colors.plum} />
                      </View>
                    </View>
                    {active && <Icon name="check-circle" size={22} color={theme.accent} />}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          href="/(patient)/call-status"
          icon="phone"
          label="Book with AI agent"
        />
      </View>
    </Screen>
  );
}

const sectionTitle = {
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 12,
};
