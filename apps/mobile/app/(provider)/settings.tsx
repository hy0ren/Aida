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
    t,
  } = useAidaTheme();

  return (
    <Screen title={t("settings")} subtitle={t("providerSettingsSubtitle")}>
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
                {t("providerAccount")}
              </Text>
            </View>
            <Pill label={t("credentialed")} icon="check" />
          </View>
        </Card>

        <Card>
          <SectionTitle>{t("appearance")}</SectionTitle>
          <PaletteSelector />
          <SettingToggle
            title={t("darkMode")}
            value={mode === "dark"}
            onValueChange={(enabled) => setMode(enabled ? "dark" : "light")}
          />
        </Card>

        <Card>
          <SectionTitle>{t("preferredLanguage")}</SectionTitle>
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
          <SectionTitle>{t("clinicProfile")}</SectionTitle>
          <View style={{ gap: 12 }}>
            <Field
              label={t("clinicName")}
              value={providerProfile.clinicName}
              onChangeText={(clinicName) => updateProviderProfile({ clinicName })}
            />
            <Field
              label={t("providerEmail")}
              value={providerProfile.clinicEmail}
              onChangeText={(clinicEmail) => updateProviderProfile({ clinicEmail })}
              keyboardType="email-address"
            />
            <Field
              label={t("clinicCode")}
              value={providerProfile.clinicCode}
              onChangeText={(clinicCode) => updateProviderProfile({ clinicCode })}
            />
            <Field
              label={t("phone")}
              value={providerProfile.phone}
              onChangeText={(phone) => updateProviderProfile({ phone })}
              keyboardType="phone-pad"
            />
            <Field
              label={t("timezone")}
              value={providerProfile.timezone}
              onChangeText={(timezone) => updateProviderProfile({ timezone })}
            />
          </View>
        </Card>

        <Card>
          <SectionTitle>{t("preferences")}</SectionTitle>
          <SettingToggle
            title={t("newBookingAlerts")}
            detail={t("newBookingAlertsDetail")}
            value={notifications}
            onValueChange={setNotifications}
          />
          <SettingToggle
            title={t("calendarSync")}
            detail={t("providerCalendarSyncDetail")}
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
          label={t("logout")}
        />
      </View>
    </Screen>
  );
}
