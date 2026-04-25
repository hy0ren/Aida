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

export default function ProviderSettingsScreen() {
  const router = useRouter();
  const {
    mode,
    setMode,
    notifications,
    setNotifications,
    calendarSync,
    setCalendarSync,
    language,
    setLanguage,
    providerProfile,
    updateProviderProfile,
    logout,
    theme,
  } = useAidaTheme();

  return (
    <Screen title="Settings" subtitle="Provider portal preferences and account controls.">
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
              <Icon name="stethoscope" size={30} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 20, fontWeight: "900" }}>
                {providerProfile.clinicName}
              </Text>
              <Text style={{ color: theme.muted, marginTop: 3 }}>
                Provider account
              </Text>
            </View>
            <Pill label="Credentialed" icon="check" />
          </View>
        </Card>

        <Card>
          <SectionTitle>Appearance</SectionTitle>
          <PaletteSelector />
          <SettingToggle
            title="Dark mode"
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
          <SectionTitle>Clinic profile</SectionTitle>
          <View style={{ gap: 12 }}>
            <Field
              label="Clinic name"
              value={providerProfile.clinicName}
              onChangeText={(clinicName) => updateProviderProfile({ clinicName })}
            />
            <Field
              label="Provider email"
              value={providerProfile.clinicEmail}
              onChangeText={(clinicEmail) => updateProviderProfile({ clinicEmail })}
              keyboardType="email-address"
            />
            <Field
              label="Clinic code"
              value={providerProfile.clinicCode}
              onChangeText={(clinicCode) => updateProviderProfile({ clinicCode })}
            />
            <Field
              label="Phone"
              value={providerProfile.phone}
              onChangeText={(phone) => updateProviderProfile({ phone })}
              keyboardType="phone-pad"
            />
            <Field
              label="Timezone"
              value={providerProfile.timezone}
              onChangeText={(timezone) => updateProviderProfile({ timezone })}
            />
          </View>
        </Card>

        <Card>
          <SectionTitle>Preferences</SectionTitle>
          <SettingToggle
            title="New booking alerts"
            detail="Notify clinic staff when Aida books a patient"
            value={notifications}
            onValueChange={setNotifications}
          />
          <SettingToggle
            title="Calendar sync"
            detail="Mirror confirmed appointments to clinic calendar"
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
