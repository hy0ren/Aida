import { Text, View } from "react-native";
import { Card, Icon, Pill, PrimaryButton, Screen, colors, useAidaTheme } from "../../components/aida";

export default function ProviderDashboardScreen() {
  const { theme, language } = useAidaTheme();
  return (
    <Screen title="Today" subtitle="Bayview Family Medicine appointment queue.">
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card style={{ backgroundColor: theme.accent }}>
          <Text style={{ color: "#fff", fontSize: 36, fontFamily: "Georgia", fontWeight: "700" }}>
            8
          </Text>
          <Text style={{ color: "#fff", fontWeight: "900", marginTop: 4 }}>
            visits today
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.82)", lineHeight: 20, marginTop: 8 }}>
            1 new AI-booked appointment needs intake review.
          </Text>
        </Card>

        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 18, fontWeight: "900" }}>
                Maria Rivera
              </Text>
              <Text style={{ color: theme.muted, marginTop: 4 }}>
                2:30 PM - General care
              </Text>
            </View>
            <Pill label="AI booked" icon="creation" />
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <Pill label={language} icon="translate" tone={colors.plum} />
            <Pill label="Aetna" icon="shield-check" tone={colors.green} />
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
          <ProviderRow name="Jae Kim" detail="Thu 9:00 AM - Cardiology" />
          <ProviderRow name="Sofia Alvarez" detail="Fri 11:00 AM - Follow-up" />
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
