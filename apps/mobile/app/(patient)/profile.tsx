import { useRouter } from "expo-router";
import { Pressable, Switch, Text, View } from "react-native";
import {
  Card,
  Field,
  Icon,
  Pill,
  Screen,
  SecondaryButton,
  useAidaTheme,
} from "../../components/aida";

const languageOptions = [
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
          <Text style={[sectionTitle, { color: theme.ink }]}>Appearance</Text>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 16,
              backgroundColor: theme.surface,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: theme.accent,
              }}
            />
            <Text style={{ color: theme.ink, fontWeight: "900" }}>
              Aida Red
            </Text>
            <Text style={{ color: theme.muted, flex: 1, textAlign: "right" }}>
              Default
            </Text>
          </View>

          <SettingToggle
            title="Dark mode"
            detail="Switch app surfaces and cards"
            value={mode === "dark"}
            onValueChange={(enabled) => setMode(enabled ? "dark" : "light")}
          />
        </Card>

        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>Preferred language</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {languageOptions.map((item) => (
              <Pressable key={item} onPress={() => setLanguage(item)}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 999,
                    backgroundColor: language === item ? theme.accent : theme.surface,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <View style={{ width: 14, height: 14 }}>
                    {language === item && <Icon name="check" size={14} color="#fff" />}
                  </View>
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
          <Text style={[sectionTitle, { color: theme.ink }]}>Care preferences</Text>
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
          <Text style={[sectionTitle, { color: theme.ink }]}>Health data</Text>
          <ProfileRow icon="sync" title="Sync Health Data" detail="Apple Health connected" />
          <ProfileRow icon="dna" title="Genetic predisposition" detail="Not uploaded" />
          <ProfileRow icon="camera-account" title="Identification photo" detail="Optional" />
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

function SettingToggle({
  title,
  detail,
  value,
  onValueChange,
}: {
  title: string;
  detail: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { theme } = useAidaTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingTop: 14,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.ink, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: theme.muted, marginTop: 3, fontSize: 12 }}>
          {detail}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.line, true: `${theme.accent}70` }}
        thumbColor={value ? theme.accent : "#fff"}
      />
    </View>
  );
}

const sectionTitle = {
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 12,
};
