import { Text, View } from "react-native";
import { demoData } from "@aida/shared";
import { Card, Icon, Pill, Screen, SecondaryButton, colors } from "../../components/aida";

export default function ProfileScreen() {
  return (
    <Screen title="Profile" subtitle="Account, health sync, and care preferences.">
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 22,
                backgroundColor: "#e8f7f3",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="account" size={34} color={colors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontSize: 20, fontWeight: "900" }}>
                {demoData.patient.name}
              </Text>
              <Text style={{ color: colors.muted, marginTop: 3 }}>
                Patient account
              </Text>
            </View>
            <Pill label="Verified" icon="check" />
          </View>
        </Card>

        <Card>
          <Text style={sectionTitle}>Health data</Text>
          <View style={{ gap: 10 }}>
            <ProfileRow icon="sync" title="Sync Health Data" detail="Apple Health connected" />
            <ProfileRow icon="dna" title="Genetic predisposition" detail="Not uploaded" />
            <ProfileRow icon="camera-account" title="Identification photo" detail="Optional" />
          </View>
        </Card>

        <Card>
          <Text style={sectionTitle}>Account</Text>
          <View style={{ gap: 10 }}>
            <ProfileRow icon="google" title="Google account" detail="maria@example.com" />
            <ProfileRow icon="translate" title="Language" detail={demoData.patient.preferredLanguage.label} />
            <ProfileRow icon="account-details" title="Demographics" detail="Edit" />
          </View>
        </Card>

        <SecondaryButton href="/(auth)/login" icon="logout" label="Log out" />
      </View>
    </Screen>
  );
}

function ProfileRow({
  icon,
  title,
  detail,
}: {
  icon: "sync" | "dna" | "camera-account" | "google" | "translate" | "account-details";
  title: string;
  detail: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 8,
      }}
    >
      <Icon name={icon} size={22} color={colors.teal} />
      <Text style={{ flex: 1, color: colors.ink, fontWeight: "800" }}>{title}</Text>
      <Text style={{ color: colors.muted }}>{detail}</Text>
    </View>
  );
}

const sectionTitle = {
  color: colors.ink,
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 10,
};
