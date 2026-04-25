import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
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
  getHomeRouteForRole,
  useAidaTheme,
  type AidaRole,
} from "../../components/aida";
import { GlassScanner, type CapturedCard } from "../../components/GlassScanner";
import { uploadPatientIntake } from "../../lib/api";

const languages = [
  "English",
  "Spanish",
  "Korean",
  "Chinese",
  "Arabic",
  "Hindi",
  "French",
  "Tagalog",
  "Vietnamese",
  "Portuguese",
];

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    role: savedRole,
    patientProfile,
    providerProfile,
    language,
    setLanguage,
    completeOnboarding,
    logout,
    theme,
  } = useAidaTheme();
  const [role, setRole] = useState<AidaRole>(savedRole);
  const [name, setName] = useState(patientProfile.name);
  const [phone, setPhone] = useState(patientProfile.phone);
  const [timezone, setTimezone] = useState(patientProfile.timezone);
  const [emergencyContact, setEmergencyContact] = useState(patientProfile.emergencyContact);
  const [clinicEmail, setClinicEmail] = useState(providerProfile.clinicEmail);
  const [clinicCode, setClinicCode] = useState(providerProfile.clinicCode);

  // Insurance card capture via GlassScanner
  const [frontCard, setFrontCard] = useState<CapturedCard | null>(null);
  const [backCard, setBackCard] = useState<CapturedCard | null>(null);
  const [healthData, setHealthData] = useState(patientProfile.hasHealthDataUpload);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);

  const isProvider = role === "provider";
  const insuranceComplete = Boolean(frontCard && backCard);

  async function finishOnboarding() {
    setIsUploading(true);

    // Upload insurance cards if captured
    if (!isProvider && (frontCard || backCard)) {
      try {
        const files: Array<{ name: string; type: any; data: string }> = [];
        if (frontCard?.base64) {
          files.push({
            name: "insurance-card-front.jpg",
            type: "insurance-front",
            data: `data:image/jpeg;base64,${frontCard.base64}`,
          });
        }
        if (backCard?.base64) {
          files.push({
            name: "insurance-card-back.jpg",
            type: "insurance-back",
            data: `data:image/jpeg;base64,${backCard.base64}`,
          });
        }
        await uploadPatientIntake({
          insuranceComplete,
          healthComplete: healthData,
          healthSource: "Apple Health",
          notes: "Uploaded during onboarding",
          files,
        });
      } catch (err) {
        console.warn("Upload failed during onboarding:", err);
        Alert.alert(
          "Upload notice",
          "Insurance cards couldn't be uploaded now. You can add them later from the Upload screen.",
          [{ text: "Continue" }]
        );
      }
    }

    completeOnboarding({
      role,
      patientProfile: {
        name,
        phone,
        timezone,
        emergencyContact,
        hasInsuranceUpload: insuranceComplete,
        hasHealthDataUpload: healthData,
      },
      providerProfile: {
        clinicEmail,
        clinicCode,
      },
    });

    setIsUploading(false);
    router.replace(getHomeRouteForRole(role) as never);
  }

  function returnToLogin() {
    logout();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/login?mode=login");
    }
  }

  return (
    <Screen
      title="Set up Aida"
      subtitle="Choose your role first, then personalize the dashboard Aida opens for you."
      action={<StepDots count={3} active={2} />}
    >
      <View style={{ gap: 16 }}>
        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>1. Preferred language</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {languages.map((item) => (
              <Pressable key={item} onPress={() => setLanguage(item)}>
                <View
                  style={{
                    minHeight: 34,
                    paddingHorizontal: language === item ? 10 : 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor:
                      language === item ? theme.accent : theme.surface,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {language === item && <Icon name="check" size={13} color="#fff" />}
                  <Text
                    style={{
                      color: language === item ? "#fff" : theme.ink,
                      fontWeight: "800",
                      fontSize: 12,
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
          <Text style={[sectionTitle, { color: theme.ink }]}>2. Select your role</Text>
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
              <Pressable key={item.id} onPress={() => setRole(item.id as AidaRole)}>
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
            <Text style={[sectionTitle, { color: theme.ink }]}>3. Insurance card</Text>
            <Text style={{ color: theme.muted, lineHeight: 20, marginBottom: 14 }}>
              Snap photos of both sides. Aida will OCR the details for your first visit.
            </Text>
            <View style={{ gap: 10 }}>
              <GlassScanner
                label="Front of card"
                detail="Name, plan, member ID"
                value={frontCard}
                onChange={setFrontCard}
              />
              <GlassScanner
                label="Back of card"
                detail="Claims phone and payer details"
                value={backCard}
                onChange={setBackCard}
              />
            </View>
            {insuranceComplete && (
              <View style={{ marginTop: 10, alignItems: "flex-start" }}>
                <Pill label="Both sides captured" icon="check" />
              </View>
            )}
          </Card>
        )}

        {!isProvider && (
          <Card>
            <Text style={[sectionTitle, { color: theme.ink }]}>4. Health data (optional)</Text>
            <UploadChoice
              title="Health data"
              detail="Apple Health, Garmin, Whoop, Oura"
              icon="heart-pulse"
              active={healthData}
              accent={theme.accent}
              onPress={() => setHealthData((v) => !v)}
            />
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
            icon={isUploading ? "creation" : "arrow-right"}
            label={isUploading ? "Setting up Aida…" : isProvider ? "Enter provider portal" : "Finish onboarding"}
            onPress={finishOnboarding}
            disabled={isUploading}
          />
          <SecondaryButton onPress={returnToLogin} icon="arrow-left" label="Back to login" />
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
