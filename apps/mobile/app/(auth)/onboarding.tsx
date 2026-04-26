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
import { updateAuthProfile, uploadPatientIntake } from "../../lib/api";

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
    userId,
    language,
    setLanguage,
    completeOnboarding,
    logout,
    theme,
    t,
  } = useAidaTheme();
  const [role, setRole] = useState<AidaRole>(savedRole);
  const [firstName, setFirstName] = useState(patientProfile.firstName);
  const [lastName, setLastName] = useState(patientProfile.lastName);
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
          patientId: userId,
          insuranceComplete,
          healthComplete: healthData,
          healthSource: "Apple Health",
          notes: t("uploadedDuringOnboarding"),
          files,
        });
      } catch (err) {
        console.warn("Upload failed during onboarding:", err);
        Alert.alert(
          t("uploadNotice"),
          t("insuranceUploadLater"),
          [{ text: t("continue") }]
        );
      }
    }

    const nextPatientProfile = {
      firstName,
      lastName,
      phone,
      timezone,
      emergencyContact,
      hasInsuranceUpload: insuranceComplete,
      hasHealthDataUpload: healthData,
    };
    const nextProviderProfile = {
      ...providerProfile,
      clinicEmail,
      clinicCode,
    };

    try {
      await updateAuthProfile({
        role,
        firstName: isProvider ? undefined : nextPatientProfile.firstName,
        lastName: isProvider ? undefined : nextPatientProfile.lastName,
        name: isProvider
          ? nextProviderProfile.clinicName
          : `${nextPatientProfile.firstName} ${nextPatientProfile.lastName}`.trim(),
        phone: isProvider ? nextProviderProfile.phone : nextPatientProfile.phone,
        timezone: isProvider ? nextProviderProfile.timezone : nextPatientProfile.timezone,
        language,
        onboardingComplete: true,
        patientProfile: {
          ...nextPatientProfile,
          patientId: userId,
        },
        providerProfile: {
          ...nextProviderProfile,
          providerId: userId,
          verifiedProvider: isProvider,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("onboardingSaveFailed");
      Alert.alert(t("profileSaveFailed"), message);
      setIsUploading(false);
      return;
    }

    completeOnboarding({
      role,
      patientProfile: nextPatientProfile,
      providerProfile: nextProviderProfile,
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
      title={t("setupAida")}
      subtitle={t("setupAidaSubtitle")}
      action={<StepDots count={3} active={2} />}
    >
      <View style={{ gap: 16 }}>
        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>1. {t("preferredLanguage")}</Text>
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
          <Text style={[sectionTitle, { color: theme.ink }]}>2. {t("selectRole")}</Text>
          <View style={{ gap: 10 }}>
            {[
              {
                id: "patient",
                title: t("iAmPatient"),
                icon: "account-heart",
              },
              {
                id: "parent",
                title: t("manageChildCare"),
                icon: "human-male-child",
              },
              {
                id: "provider",
                title: t("iAmProvider"),
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
            <Text style={[sectionTitle, { color: theme.ink }]}>3. {t("insuranceCard")}</Text>
            <Text style={{ color: theme.muted, lineHeight: 20, marginBottom: 14 }}>
              Snap photos of both sides. Aida will OCR the details for your first visit.
            </Text>
            <View style={{ gap: 10 }}>
              <GlassScanner
                label={t("frontOfCard")}
                detail={t("frontOfCardDetail")}
                value={frontCard}
                onChange={setFrontCard}
              />
              <GlassScanner
                label={t("backOfCard")}
                detail={t("backOfCardDetail")}
                value={backCard}
                onChange={setBackCard}
              />
            </View>
            {insuranceComplete && (
              <View style={{ marginTop: 10, alignItems: "flex-start" }}>
                <Pill label={t("bothSidesCaptured")} icon="check" />
              </View>
            )}
          </Card>
        )}

        {!isProvider && (
          <Card>
            <Text style={[sectionTitle, { color: theme.ink }]}>4. {t("healthDataOptional")}</Text>
            <UploadChoice
              title={t("healthData")}
              detail={t("wearableSources")}
              icon="heart-pulse"
              active={healthData}
              accent={theme.accent}
              onPress={() => setHealthData((v) => !v)}
            />
          </Card>
        )}

        {isProvider ? (
          <Card>
            <Text style={[sectionTitle, { color: theme.ink }]}>{t("providerCredentials")}</Text>
            <View style={{ gap: 10 }}>
              <Field label={t("clinicEmail")} value={clinicEmail} onChangeText={setClinicEmail} />
              <Field label={t("clinicCode")} value={clinicCode} onChangeText={setClinicCode} />
            </View>
          </Card>
        ) : (
          <Card>
            <Text style={[sectionTitle, { color: theme.ink }]}>{t("profile")}</Text>
            <View style={{ gap: 10 }}>
              <Field label={t("firstName")} value={firstName} onChangeText={setFirstName} />
              <Field label={t("lastName")} value={lastName} onChangeText={setLastName} />
              <Field label={t("phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Field label={t("timezone")} value={timezone} onChangeText={setTimezone} />
              <Field label={t("emergencyContact")} value={emergencyContact} onChangeText={setEmergencyContact} />
            </View>
          </Card>
        )}

        <View style={{ gap: 10 }}>
          <PrimaryButton
            icon={isUploading ? "creation" : "arrow-right"}
            label={isUploading ? t("settingUpAida") : isProvider ? t("enterProviderPortal") : t("finishOnboarding")}
            onPress={finishOnboarding}
            disabled={isUploading}
          />
          <SecondaryButton onPress={returnToLogin} icon="arrow-left" label={t("backToLogin")} />
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
  const { theme, t } = useAidaTheme();
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
        {active ? <Pill label={t("added")} icon="check" /> : <Pill label={t("optional")} tone={colors.faint} />}
      </View>
    </Pressable>
  );
}

const sectionTitle = {
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 14,
};
