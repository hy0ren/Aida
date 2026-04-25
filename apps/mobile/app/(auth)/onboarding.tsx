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
  useAidaTheme,
} from "../../components/aida";

const languages = [
  "English",
  "Spanish",
  "Korean",
  "Chinese",
  "Vietnamese",
  "Tagalog",
  "Arabic",
  "Hindi",
  "French",
  "Portuguese",
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "parent" | "provider">("patient");
  const [insurance, setInsurance] = useState(false);
  const [healthData, setHealthData] = useState(false);
  const [name, setName] = useState("Maria Rivera");
  const [phone, setPhone] = useState("+1 (415) 555-4729");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [emergencyContact, setEmergencyContact] = useState("Ana Rivera");
  const [clinicEmail, setClinicEmail] = useState("frontdesk@bayview.example");
  const [clinicCode, setClinicCode] = useState("BAYVIEW-DEMO");
  const { language, setLanguage, theme } = useAidaTheme();

  const isProvider = role === "provider";

  return (
    <Screen
      title="Set up Aida"
      subtitle="A few choices personalize your dashboard, SMS, and scheduling flow."
      action={<StepDots count={3} active={2} />}
    >
      <View style={{ gap: 16 }}>
        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>1. Preferred language</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
            {languages.map((item) => (
              <Pressable key={item} onPress={() => setLanguage(item)}>
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor:
                      language === item ? theme.accent : theme.surface,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {language === item && <Icon name="check" size={14} color="#fff" />}
                  <Text
                    style={{
                      color: language === item ? "#fff" : theme.ink,
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
          <Text style={[sectionTitle, { color: theme.ink }]}>2. Who are you using Aida for?</Text>
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
                    borderColor: role === item.id ? theme.accent : theme.line,
                    backgroundColor: role === item.id ? theme.surface : theme.card,
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
                    color={role === item.id ? theme.accent : theme.muted}
                  />
                  <Text style={{ flex: 1, color: theme.ink, fontWeight: "800" }}>
                    {item.title}
                  </Text>
                  {role === item.id && <Icon name="check-circle" color={theme.accent} />}
                </View>
              </Pressable>
            ))}
          </View>
        </Card>

        {!isProvider && (
          <Card>
            <Text style={[sectionTitle, { color: theme.ink }]}>3. Optional demo uploads</Text>
            <Text style={{ color: theme.muted, lineHeight: 20, marginBottom: 14 }}>
              You can skip these now and add them later from the Upload screen.
            </Text>
            <View style={{ gap: 10 }}>
              <UploadChoice
                title="Insurance card"
                detail="Cloudinary OCR ready"
                icon="card-account-details"
                active={insurance}
                accent={theme.accent}
                onPress={() => setInsurance((v) => !v)}
              />
              <UploadChoice
                title="Health data"
                detail="Apple Health, Garmin, Whoop, Oura"
                icon="heart-pulse"
                active={healthData}
                accent={theme.accent}
                onPress={() => setHealthData((v) => !v)}
              />
            </View>
          </Card>
        )}

        {isProvider ? (
          <Card>
            <Text style={[sectionTitle, { color: theme.ink }]}>Provider credentials</Text>
            <View style={{ gap: 10 }}>
              <Field label="Clinic email" value={clinicEmail} onChangeText={setClinicEmail} />
              <Field label="Clinic code" value={clinicCode} onChangeText={setClinicCode} />
            </View>
          </Card>
        ) : (
          <Card>
            <Text style={[sectionTitle, { color: theme.ink }]}>Profile</Text>
            <View style={{ gap: 10 }}>
              <Field label="Name" value={name} onChangeText={setName} />
              <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Field label="Timezone" value={timezone} onChangeText={setTimezone} />
              <Field label="Emergency contact" value={emergencyContact} onChangeText={setEmergencyContact} />
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
  accent,
  onPress,
}: {
  title: string;
  detail: string;
  icon: "card-account-details" | "heart-pulse";
  active: boolean;
  accent: string;
  onPress: () => void;
}) {
  const { theme } = useAidaTheme();
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: active ? accent : theme.line,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: active ? `${accent}14` : theme.surface,
        }}
      >
        <Icon name={icon} size={24} color={active ? accent : theme.muted} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.ink, fontWeight: "900" }}>{title}</Text>
          <Text style={{ color: theme.muted, fontSize: 12, marginTop: 3 }}>
            {detail}
          </Text>
        </View>
        {active ? <Pill label="Added" icon="check" /> : <Pill label="Optional" tone={colors.faint} />}
      </View>
    </Pressable>
  );
}

const sectionTitle = {
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 14,
};
