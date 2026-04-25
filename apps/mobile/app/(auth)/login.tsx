import { Link, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  Card,
  GlassCard,
  Icon,
  PrimaryButton,
  colors,
  fonts,
  useAidaTheme,
} from "../../components/aida";

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useAidaTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.wash,
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
              backgroundColor: theme.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="triangle" size={22} color="#fff" />
          </View>
          <Text style={{ color: theme.ink, fontSize: 30, fontWeight: "700", fontFamily: fonts.display }}>
            Aida
          </Text>
        </View>

        <Text
          style={{
            color: theme.ink,
            fontSize: 42,
            lineHeight: 47,
            fontWeight: "700",
            marginTop: 34,
            letterSpacing: -0.4,
            fontFamily: fonts.display,
          }}
        >
          Healthcare, in your language.
        </Text>
        <Text
          style={{
            color: theme.muted,
            fontSize: 16,
            lineHeight: 24,
            marginTop: 16,
            fontFamily: fonts.body,
          }}
        >
          Upload your health data, approve what gets shared, and let Aida help
          schedule care without the hold music.
        </Text>
      </View>

      <GlassCard>
        <View style={{ gap: 12 }}>
          <PrimaryButton
            onPress={() => router.push("/(auth)/verify")}
            icon="google"
            label="Continue with Google"
          />
          <Text style={{ color: theme.muted, lineHeight: 20, textAlign: "center" }}>
            Google sign-in is step one. World ID verification is required next
            before onboarding unlocks.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
          <View style={{ flex: 1, padding: 13, borderRadius: 16, backgroundColor: theme.surface }}>
            <Icon name="translate" size={20} color={colors.plum} />
            <Text
              style={{
                color: theme.ink,
                fontSize: 13,
                fontWeight: "800",
                marginTop: 8,
              }}
            >
              Multilingual
            </Text>
          </View>
          <View style={{ flex: 1, padding: 13, borderRadius: 16, backgroundColor: theme.surface }}>
            <Icon name="shield-check" size={20} color={theme.accent} />
            <Text
              style={{
                color: theme.ink,
                fontSize: 13,
                fontWeight: "800",
                marginTop: 8,
              }}
            >
              Private first
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
            marginTop: 20,
          }}
        >
          <Text style={{ color: theme.muted }}>Clinic staff?</Text>
          <Link href="/(provider)/dashboard" asChild>
            <Pressable>
              <Text style={{ color: theme.accent, fontWeight: "800" }}>
                Login as provider
              </Text>
            </Pressable>
          </Link>
        </View>
      </GlassCard>
    </View>
  );
}
