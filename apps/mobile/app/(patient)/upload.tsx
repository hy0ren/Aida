import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Card,
  Field,
  Icon,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
  colors,
} from "../../components/aida";

export default function UploadScreen() {
  const [insuranceAdded, setInsuranceAdded] = useState(true);
  const [healthAdded, setHealthAdded] = useState(false);

  return (
    <Screen
      title="Upload"
      subtitle="Add insurance and health data. Both can be updated later."
    >
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <UploadCard
          title="Insurance card"
          detail="Photo upload with OCR preprocessing"
          icon="card-account-details"
          active={insuranceAdded}
          onPress={() => setInsuranceAdded((value) => !value)}
        />

        {insuranceAdded && (
          <Card>
            <Text style={sectionTitle}>Card details</Text>
            <View style={{ gap: 10 }}>
              <Field label="Provider" value="Aetna" />
              <Field label="Plan" value="Choice POS II" />
              <Field label="Member ID" value="XGH 482-19-7720" />
            </View>
          </Card>
        )}

        <UploadCard
          title="Health data"
          detail="CSV, PDF, Apple Health, Garmin, Whoop, Oura"
          icon="heart-pulse"
          active={healthAdded}
          onPress={() => setHealthAdded((value) => !value)}
        />

        <Card>
          <Text style={sectionTitle}>Optional notes</Text>
          <Field
            label="Anything the doctor should know?"
            multiline
            value="I have felt tired for three days and noticed my heart rate staying higher than usual."
          />
        </Card>

        <Card style={{ backgroundColor: "#f6fbfa" }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Icon name="shield-check" size={24} color={colors.teal} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontWeight: "900", fontSize: 16 }}>
                Privacy checkpoint
              </Text>
              <Text style={{ color: colors.muted, lineHeight: 20, marginTop: 4 }}>
                Raw biometric data is summarized on-device before cloud AI receives
                anything for language generation.
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          <PrimaryButton href="/(patient)/summary" icon="creation" label="Generate summary" />
          <SecondaryButton href="/(patient)/home" icon="home" label="Return home" />
        </View>
      </View>
    </Screen>
  );
}

function UploadCard({
  title,
  detail,
  icon,
  active,
  onPress,
}: {
  title: string;
  detail: string;
  icon: "card-account-details" | "heart-pulse";
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card
        style={{
          borderColor: active ? colors.teal : "rgba(23,33,31,0.06)",
          borderWidth: active ? 1.5 : 1,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? "#e8f7f3" : colors.wash,
            }}
          >
            <Icon name={icon} size={27} color={active ? colors.teal : colors.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "900" }}>
              {title}
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4, lineHeight: 19 }}>
              {detail}
            </Text>
          </View>
          <Pill label={active ? "Added" : "Optional"} icon={active ? "check" : undefined} />
        </View>
      </Card>
    </Pressable>
  );
}

const sectionTitle = {
  color: colors.ink,
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 12,
};
