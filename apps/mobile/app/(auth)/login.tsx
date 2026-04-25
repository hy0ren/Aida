import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  Card,
  GlassCard,
  Icon,
  PrimaryButton,
  SecondaryButton,
  colors,
} from "../../components/aida";

export default function LoginScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.wash,
        padding: 22,
        justifyContent: "space-between",
      }}
    >
      <View style={{ paddingTop: 70 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: colors.teal,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="triangle" size={22} color="#fff" />
          </View>
          <Text style={{ color: colors.ink, fontSize: 30, fontWeight: "900" }}>
            Aida
          </Text>
        </View>

        <Text
          style={{
            color: colors.ink,
            fontSize: 42,
            lineHeight: 47,
            fontWeight: "900",
            marginTop: 34,
            letterSpacing: -0.4,
          }}
        >
          Healthcare, in your language.
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: 16,
            lineHeight: 24,
            marginTop: 16,
          }}
        >
          Upload your health data, approve what gets shared, and let Aida help
          schedule care without the hold music.
        </Text>
      </View>

      <GlassCard>
        <View style={{ gap: 12 }}>
          <PrimaryButton
            href="/(auth)/onboarding"
            icon="google"
            label="Continue with Google"
          />
          <SecondaryButton
            href="/(auth)/verify"
            icon="earth"
            label="Verify identity with World ID"
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
          <Card style={{ flex: 1, padding: 13, borderRadius: 16 }}>
            <Icon name="translate" size={20} color={colors.plum} />
            <Text
              style={{
                color: colors.ink,
                fontSize: 13,
                fontWeight: "800",
                marginTop: 8,
              }}
            >
              Multilingual
            </Text>
          </Card>
          <Card style={{ flex: 1, padding: 13, borderRadius: 16 }}>
            <Icon name="shield-check" size={20} color={colors.teal} />
            <Text
              style={{
                color: colors.ink,
                fontSize: 13,
                fontWeight: "800",
                marginTop: 8,
              }}
            >
              Private first
            </Text>
          </Card>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
            marginTop: 20,
          }}
        >
          <Text style={{ color: colors.muted }}>Clinic staff?</Text>
          <Link href="/(provider)/dashboard" asChild>
            <Pressable>
              <Text style={{ color: colors.teal, fontWeight: "800" }}>
                Login as provider
              </Text>
            </Pressable>
          </Link>
        </View>
      </GlassCard>
    </View>
  );
}
