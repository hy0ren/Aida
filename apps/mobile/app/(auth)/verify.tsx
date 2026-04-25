import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Card,
  Icon,
  PrimaryButton,
  SecondaryButton,
  StepDots,
  colors,
} from "../../components/aida";

export default function VerifyScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<"ready" | "scanning" | "done">("ready");

  function begin() {
    setStage("scanning");
    setTimeout(() => {
      setStage("done");
      setTimeout(() => router.replace("/(auth)/onboarding"), 700);
    }, 1300);
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.wash,
        padding: 22,
        justifyContent: "space-between",
      }}
    >
      <View style={{ paddingTop: 64 }}>
        <Pressable onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color={colors.ink} />
        </Pressable>
        <Text
          style={{
            color: colors.ink,
            fontSize: 36,
            fontWeight: "900",
            marginTop: 32,
            letterSpacing: -0.3,
          }}
        >
          Verify once. Book safely.
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: 16,
            lineHeight: 24,
            marginTop: 12,
          }}
        >
          World ID helps prevent duplicate or fraudulent appointment bookings
          before a patient account is created.
        </Text>
      </View>

      <Card style={{ alignItems: "center", paddingVertical: 34 }}>
        <View
          style={{
            width: 132,
            height: 132,
            borderRadius: 66,
            borderWidth: 2,
            borderColor: stage === "done" ? colors.green : colors.teal,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f7fbfa",
          }}
        >
          <Icon
            name={stage === "done" ? "check" : "account-circle-outline"}
            size={58}
            color={stage === "done" ? colors.green : colors.teal}
          />
        </View>
        <Text
          style={{
            color: colors.ink,
            fontSize: 20,
            fontWeight: "900",
            marginTop: 22,
          }}
        >
          {stage === "ready"
            ? "Proof of personhood"
            : stage === "scanning"
              ? "Checking proof..."
              : "Verified"}
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: 14,
            lineHeight: 21,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          No SSN required. This is a demo placeholder for the IDKit flow.
        </Text>
        <View style={{ marginTop: 22 }}>
          <StepDots count={3} active={stage === "ready" ? 0 : stage === "scanning" ? 1 : 2} />
        </View>
      </Card>

      <View style={{ gap: 10 }}>
        <PrimaryButton
          disabled={stage !== "ready"}
          icon="earth"
          label={stage === "ready" ? "Begin verification" : "Verifying"}
          onPress={begin}
        />
        <SecondaryButton
          href="/(auth)/onboarding"
          icon="skip-next"
          label="Skip for demo"
        />
      </View>
    </View>
  );
}
