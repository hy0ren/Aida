import { Text, View } from "react-native";
import {
  Card,
  Icon,
  MetricCard,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
  colors,
} from "../../components/aida";

export default function HomeScreen() {
  return (
    <Screen
      title="Biometrics"
      subtitle="Good morning, Maria. Your recent data is ready for review."
      action={<Pill label="Spanish" icon="translate" tone={colors.plum} />}
    >
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card style={{ backgroundColor: colors.ink }}>
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

        <View style={{ flexDirection: "row", gap: 10 }}>
          <MetricCard
            icon="heart"
            label="Resting HR"
            value="78"
            detail="+12 bpm above normal"
            flagged
          />
          <MetricCard
            icon="sleep"
            label="Sleep score"
            value="65"
            detail="17 points lower"
            flagged
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <MetricCard
            icon="chart-bell-curve"
            label="HRV"
            value="42ms"
            detail="Trending down"
            flagged
          />
          <MetricCard
            icon="shoe-print"
            label="Steps"
            value="5.2k"
            detail="Light activity"
          />
        </View>

        <Card>
          <Text style={sectionTitle}>Quick actions</Text>
          <View style={{ gap: 10 }}>
            <PrimaryButton href="/(patient)/upload" icon="cloud-upload" label="Upload data" />
            <SecondaryButton href="/(patient)/book" icon="calendar-plus" label="Book appointment" />
            <SecondaryButton href="/(patient)/history" icon="history" label="View history" />
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={sectionTitle}>Upcoming appointment</Text>
              <Text style={{ color: colors.ink, fontSize: 16, fontWeight: "900" }}>
                Dr. Lin Chen
              </Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                Wed, May 6 at 2:30 PM
              </Text>
            </View>
            <Pill label="Confirmed" icon="check" />
          </View>
        </Card>

        <Card>
          <Text style={sectionTitle}>Recent SMS</Text>
          <Text style={{ color: colors.muted, lineHeight: 21 }}>
            Aida: Your appointment with Bayview Family Medicine is confirmed for
            Wed, May 6 at 2:30 PM.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

const sectionTitle = {
  color: colors.ink,
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 12,
};
