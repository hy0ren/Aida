import { Text, View } from "react-native";
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

export default function HomeScreen() {
  const { theme, mode, language } = useAidaTheme();
  return (
    <Screen
      title="Biometrics"
      subtitle="Good morning, Maria. Your recent data is ready for review."
      action={<Pill label={language} icon="translate" tone={colors.plum} />}
    >
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card style={{ backgroundColor: mode === "dark" ? "#2f3035" : colors.ink }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#b7cbc5", fontSize: 13, fontWeight: "800" }}>
                Health status
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: "900",
                  marginTop: 6,
                  lineHeight: 33,
                }}
              >
                3 vitals need attention
              </Text>
              <Text style={{ color: "#d9e6e2", fontSize: 14, lineHeight: 21, marginTop: 8 }}>
                Resting heart rate, sleep score, and HRV changed from your normal range.
              </Text>
            </View>
            <Icon name="heart-pulse" size={44} color="#d7fff3" />
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
            <Pill label="Last sync: Today" icon="sync" tone="#d7fff3" />
            <Pill label="On-device" icon="shield-check" tone="#d7fff3" />
          </View>
        </Card>

        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>Today’s metrics</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Pill label="HR 78 bpm" icon="heart" tone={colors.amber} />
            <Pill label="Sleep 65/100" icon="sleep" tone={colors.amber} />
            <Pill label="HRV 42 ms" icon="chart-bell-curve" tone={colors.amber} />
            <Pill label="Steps 5.2k" icon="shoe-print" tone={colors.green} />
          </View>
          <View style={{ height: 1, backgroundColor: theme.line, marginVertical: 16 }} />
          <Text style={[sectionTitle, { color: theme.ink }]}>Next appointment</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900" }}>
                Dr. Lin Chen
              </Text>
              <Text style={{ color: theme.muted, marginTop: 4 }}>
                Wed, May 6 at 2:30 PM
              </Text>
            </View>
            <Pill label="Confirmed" icon="check" />
          </View>
        </Card>

        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>Actions</Text>
          <View style={{ gap: 10 }}>
            <PrimaryButton href="/(patient)/upload" icon="cloud-upload" label="Upload data" />
            <SecondaryButton href="/(patient)/book" icon="calendar-plus" label="Book appointment" />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const sectionTitle = {
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 12,
};
