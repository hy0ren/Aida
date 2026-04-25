import { Text, View } from "react-native";
import { Card, Icon, Pill, Screen, SecondaryButton, colors } from "../../components/aida";

export default function ProviderDashboardScreen() {
  return (
    <Screen title="Provider" subtitle="Today's AI-booked appointment queue.">
      <View style={{ gap: 14 }}>
        {["Maria Rivera", "Jae Kim", "Sofia Alvarez"].map((name, index) => (
          <Card key={name}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Icon name="account-heart" size={25} color={colors.teal} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "900" }}>
                  {name}
                </Text>
                <Text style={{ color: colors.muted, marginTop: 3 }}>
                  {index === 0 ? "2:30 PM - General care" : "Pending review"}
                </Text>
              </View>
              <Pill label={index === 0 ? "New" : "Review"} />
            </View>
          </Card>
        ))}
        <SecondaryButton href="/(provider)/schedule" icon="calendar-edit" label="Manage schedule" />
      </View>
    </Screen>
  );
}
