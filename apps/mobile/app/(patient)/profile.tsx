import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  Card,
  Field,
  Icon,
  PaletteSelector,
  Pill,
  Screen,
  SecondaryButton,
  SectionTitle,
  SettingToggle,
  useAidaTheme,
} from "../../components/aida";

const languageOptions = [
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

export default function ProfileScreen() {
  const router = useRouter();
  const {
    mode,
    setMode,
    language,
    setLanguage,
    notifications,
    setNotifications,
    calendarSync,
    setCalendarSync,
    patientProfile,
    updatePatientProfile,
    role,
    logout,
    theme,
  } = useAidaTheme();

  return (
    <Screen title="Settings" subtitle="Personalize Aida for your care workflow.">
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 20,
                backgroundColor: `${theme.accent}18`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="account" size={32} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 20, fontWeight: "900" }}>
                {patientProfile.name}
              </Text>
              <Text style={{ color: theme.muted, marginTop: 3 }}>
                {role === "parent" ? "Parent account" : "Patient account"}
              </Text>
            </View>
            <Pill label="Verified" icon="check" />
          </View>
        </Card>

        <Card>
          <SectionTitle>Appearance</SectionTitle>
          <PaletteSelector />
          <SettingToggle
            title="Dark mode"
            detail="Use charcoal app surfaces"
            value={mode === "dark"}
            onValueChange={(enabled) => setMode(enabled ? "dark" : "light")}
          />
        </Card>

        <Card>
          <SectionTitle>Preferred language</SectionTitle>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {languageOptions.map((item) => (
              <Pressable key={item} onPress={() => setLanguage(item)}>
                <View
                  style={{
                    minHeight: 34,
                    paddingHorizontal: language === item ? 10 : 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: language === item ? theme.accent : theme.surface,
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
          <SectionTitle>Profile details</SectionTitle>
          <View style={{ gap: 12 }}>
            <Field
              label="Display name"
              value={patientProfile.name}
              onChangeText={(name) => updatePatientProfile({ name })}
            />
            <Field
              label="Phone"
              value={patientProfile.phone}
              onChangeText={(phone) => updatePatientProfile({ phone })}
              keyboardType="phone-pad"
            />
            <Field
              label="Timezone"
              value={patientProfile.timezone}
              onChangeText={(timezone) => updatePatientProfile({ timezone })}
            />
            <Field
              label="Emergency contact"
              value={patientProfile.emergencyContact}
              onChangeText={(emergencyContact) => updatePatientProfile({ emergencyContact })}
            />
          </View>
        </Card>

        <Card>
          <SectionTitle>Health data</SectionTitle>
          <ProfileRow icon="sync" title="Sync Health Data" detail="Apple Health connected" />
          <ProfileRow icon="dna" title="Genetic predisposition" detail="Not uploaded" />
          <ProfileRow icon="camera-account" title="Identification photo" detail="Optional" />
        </Card>

        <Card>
          <SectionTitle>Preferences</SectionTitle>
          <SettingToggle
            title="SMS notifications"
            detail="Appointment confirmations and reminders"
            value={notifications}
            onValueChange={setNotifications}
          />
          <SettingToggle
            title="Calendar sync"
            detail="Add confirmed appointments automatically"
            value={calendarSync}
            onValueChange={setCalendarSync}
          />
        </Card>

        <SecondaryButton
          onPress={() => {
            logout();
            router.replace("/(auth)/login?mode=login");
          }}
          icon="logout"
          label="Log out"
        />
      </View>
    </Screen>
  );
}

function ProfileRow({
  icon,
  title,
  detail,
}: {
  icon: "sync" | "dna" | "camera-account";
  title: string;
  detail: string;
}) {
  const { theme } = useAidaTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 9,
      }}
    >
      <Icon name={icon} size={22} color={theme.accent} />
      <Text style={{ flex: 1, color: theme.ink, fontWeight: "800" }}>{title}</Text>
      <Text style={{ color: theme.muted }}>{detail}</Text>
    </View>
  );
}
