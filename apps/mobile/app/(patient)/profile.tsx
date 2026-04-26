import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SyncConfirmationSheet } from "../../components/SyncConfirmationSheet";
import { syncAppleHealthFromProfile } from "../../lib/apple-health-sync";
import type { HealthSyncRunStats } from "../../lib/synced-health-data";
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
    t,
  } = useAidaTheme();

  const [healthSyncing, setHealthSyncing] = useState(false);
  const [syncSheet, setSyncSheet] = useState<{
    open: boolean;
    source: string;
    stats: HealthSyncRunStats | null;
  }>({ open: false, source: "", stats: null });

  return (
    <>
    <Screen title={t("settings")} subtitle={t("patientSettingsSubtitle")}>
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
                {patientProfile.firstName} {patientProfile.lastName}
              </Text>
              <Text style={{ color: theme.muted, marginTop: 3 }}>
                {role === "parent" ? t("parentAccount") : t("patientAccount")}
              </Text>
            </View>
            <Pill label={t("verifiedBadge")} icon="check" />
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
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: language === item ? theme.accent : theme.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  {language === item && (
                    <View
                      style={{
                        position: "absolute",
                        left: 10,
                        top: 0,
                        bottom: 0,
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="check" size={13} color="#fff" />
                    </View>
                  )}
                  <Text
                    style={{
                      color: language === item ? "#fff" : theme.ink,
                      fontWeight: "800",
                      fontSize: 12,
                      paddingLeft: language === item ? 14 : 0,
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
          <SectionTitle>{t("profileDetails")}</SectionTitle>
          <View style={{ gap: 12 }}>
            <Field
              label={t("firstName")}
              value={patientProfile.firstName}
              onChangeText={(firstName) => updatePatientProfile({ firstName })}
            />
            <Field
              label={t("lastName")}
              value={patientProfile.lastName}
              onChangeText={(lastName) => updatePatientProfile({ lastName })}
            />
            <Field
              label={t("phone")}
              value={patientProfile.phone}
              onChangeText={(phone) => updatePatientProfile({ phone })}
              keyboardType="phone-pad"
            />
            <Field
              label={t("timezone")}
              value={patientProfile.timezone}
              onChangeText={(timezone) => updatePatientProfile({ timezone })}
            />
            <Field
              label={t("emergencyContact")}
              value={patientProfile.emergencyContact}
              onChangeText={(emergencyContact) => updatePatientProfile({ emergencyContact })}
            />
          </View>
        </Card>

        <Card>
          <SectionTitle>{t("healthData")}</SectionTitle>
          <Pressable
            disabled={healthSyncing}
            onPress={async () => {
              if (healthSyncing) return;
              setHealthSyncing(true);
              try {
                const state = await syncAppleHealthFromProfile();
                setSyncSheet({ open: true, source: state.lastSourceLabel, stats: state.lastSyncStats ?? null });
              } catch (e) {
                console.warn("Health sync from profile", e);
              } finally {
                setHealthSyncing(false);
              }
            }}
            style={({ pressed }) => ({ opacity: pressed || healthSyncing ? 0.6 : 1 })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {healthSyncing && <ActivityIndicator color={theme.accent} size="small" />}
              <View style={{ flex: 1 }}>
                <ProfileRow
                  icon="sync"
                  title={t("syncHealthData")}
                  detail={t("syncHealthDataHint")}
                />
              </View>
            </View>
          </Pressable>
          <ProfileRow icon="dna" title={t("geneticPredisposition")} detail={t("notUploaded")} />
          <ProfileRow icon="camera-account" title={t("identificationPhoto")} detail={t("optional")} />
        </Card>

        <Card>
          <SectionTitle>{t("accountAndRecords")}</SectionTitle>
          <Pressable
            onPress={() => router.push("/(patient)/cancelled-appointments")}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 6,
                gap: 10,
              }}
            >
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Icon name="calendar-remove" size={22} color={theme.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.ink, fontWeight: "800" }}>{t("cancelledAppointments")}</Text>
                  <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                    {t("cancelledAppointmentsProfileBlurb")}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={22} color={theme.faint} />
            </View>
          </Pressable>
        </Card>

        <Card>
          <SectionTitle>{t("preferences")}</SectionTitle>
          <SettingToggle
            title={t("pushConfirmations")}
            detail={t("pushConfirmationsDetail")}
            value={notifications}
            onValueChange={setNotifications}
          />
          <SettingToggle
            title={t("calendarSync")}
            detail={t("calendarSyncDetail")}
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
    <SyncConfirmationSheet
      visible={syncSheet.open}
      onClose={() => setSyncSheet((s) => ({ ...s, open: false }))}
      sourceLabel={syncSheet.source}
      syncStats={syncSheet.stats}
    />
    </>
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
