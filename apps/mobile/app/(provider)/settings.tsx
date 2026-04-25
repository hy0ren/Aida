import { useRouter } from "expo-router";
import { Switch, Text, View } from "react-native";
import {
  Card,
  Field,
  Icon,
  Pill,
  Screen,
  SecondaryButton,
  useAidaTheme,
} from "../../components/aida";

export default function ProviderSettingsScreen() {
  const router = useRouter();
  const {
    mode,
    setMode,
    notifications,
    setNotifications,
    calendarSync,
    setCalendarSync,
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
          <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>
            Clinic profile
          </Text>
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
          <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900", marginBottom: 4 }}>
            Preferences
          </Text>
          <SettingToggle
            title="Dark mode"
            detail="Use charcoal provider surfaces"
            value={mode === "dark"}
            onValueChange={(enabled) => setMode(enabled ? "dark" : "light")}
          />
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
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 14 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.ink, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: theme.muted, marginTop: 3, fontSize: 12 }}>{detail}</Text>
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
