import { useRouter } from "expo-router";
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
  StepDots,
  colors,
} from "../../components/aida";

const languages = ["English", "Spanish", "Korean"];

export default function OnboardingScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState("Spanish");
  const [role, setRole] = useState<"patient" | "parent" | "provider">("patient");
  const [insurance, setInsurance] = useState(false);
  const [healthData, setHealthData] = useState(false);

  const isProvider = role === "provider";

  return (
    <Screen
      title="Set up Aida"
      subtitle="A few choices personalize your dashboard, SMS, and scheduling flow."
      action={<StepDots count={3} active={2} />}
    >
      <View style={{ gap: 16 }}>
        <Card>
          <Text style={sectionTitle}>1. Preferred language</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
            {languages.map((item) => (
              <Pressable key={item} onPress={() => setLanguage(item)}>
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor:
                      language === item ? colors.teal : colors.wash,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {language === item && <Icon name="check" size={14} color="#fff" />}
                  <Text
                    style={{
                      color: language === item ? "#fff" : colors.ink,
                      fontWeight: "800",
                    }}
                  >
                    {item}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={sectionTitle}>2. Who are you using Aida for?</Text>
          <View style={{ gap: 10 }}>
            {[
              {
                id: "patient",
                title: "I am the patient",
                icon: "account-heart",
              },
              {
                id: "parent",
                title: "I manage care for my child",
                icon: "human-male-child",
              },
              {
                id: "provider",
                title: "I am a provider",
                icon: "stethoscope",
              },
            ].map((item) => (
              <Pressable key={item.id} onPress={() => setRole(item.id as typeof role)}>
                <View
                  style={{
                    borderWidth: 1.5,
                    borderColor: role === item.id ? colors.teal : colors.line,
                    backgroundColor: role === item.id ? "#f3fbf9" : "#fff",
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Icon
                    name={item.icon as never}
                    size={22}
                    color={role === item.id ? colors.teal : colors.muted}
                  />
                  <Text style={{ flex: 1, color: colors.ink, fontWeight: "800" }}>
                    {item.title}
                  </Text>
                  {role === item.id && <Icon name="check-circle" color={colors.teal} />}
                </View>
              </Pressable>
            ))}
          </View>
        </Card>

        {!isProvider && (
          <Card>
            <Text style={sectionTitle}>3. Optional demo uploads</Text>
            <Text style={{ color: colors.muted, lineHeight: 20, marginBottom: 14 }}>
              You can skip these now and add them later from the Upload screen.
            </Text>
            <View style={{ gap: 10 }}>
              <UploadChoice
                title="Insurance card"
                detail="Cloudinary OCR ready"
                icon="card-account-details"
                active={insurance}
                onPress={() => setInsurance((v) => !v)}
              />
              <UploadChoice
                title="Health data"
                detail="Apple Health, Garmin, Whoop, Oura"
                icon="heart-pulse"
                active={healthData}
                onPress={() => setHealthData((v) => !v)}
              />
            </View>
          </Card>
        )}

        {isProvider ? (
          <Card>
            <Text style={sectionTitle}>Provider credentials</Text>
            <View style={{ gap: 10 }}>
              <Field label="Clinic email" value="frontdesk@bayview.example" />
              <Field label="Clinic code" value="BAYVIEW-DEMO" />
            </View>
          </Card>
        ) : (
          <Card>
            <Text style={sectionTitle}>Profile</Text>
            <View style={{ gap: 10 }}>
              <Field label="Name" value="Maria Rivera" />
              <Field label="Phone" value="+1 (415) 555-4729" />
              <Field label="Timezone" value="America/Los_Angeles" />
            </View>
          </Card>
        )}

        <View style={{ gap: 10 }}>
          <PrimaryButton
            icon="arrow-right"
            label={isProvider ? "Enter provider portal" : "Finish onboarding"}
            onPress={() =>
              router.replace(isProvider ? "/(provider)/dashboard" : "/(patient)/home")
            }
          />
          <SecondaryButton href="/(auth)/login" icon="arrow-left" label="Back to login" />
        </View>
      </View>
    </Screen>
  );
}

function UploadChoice({
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
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: active ? colors.teal : colors.line,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: active ? "#f3fbf9" : "#fff",
        }}
      >
        <Icon name={icon} size={24} color={active ? colors.teal : colors.muted} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.ink, fontWeight: "900" }}>{title}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>
            {detail}
          </Text>
        </View>
        {active ? <Pill label="Added" icon="check" /> : <Pill label="Optional" tone={colors.faint} />}
      </View>
    </Pressable>
  );
}

const sectionTitle = {
  color: colors.ink,
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 14,
};
