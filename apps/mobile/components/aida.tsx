import { MaterialCommunityIcons } from "@expo/vector-icons";
import { demoData } from "@aida/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ColorValue,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const colors = {
  ink: "#17211f",
  muted: "#66736f",
  faint: "#8c9894",
  line: "#dfe7e3",
  paper: "#fbfbf8",
  wash: "#eff4f1",
  card: "#ffffff",
  teal: "#c94f47",
  plum: "#6e3a6e",
  amber: "#d58a41",
  green: "#2f855a",
  red: "#b54735",
};

export const fonts = {
  display: "Georgia",
  body: "Avenir Next",
  mono: "Courier",
};

type ModeName = "light" | "dark";
export type AidaRole = "patient" | "parent" | "provider";

export type PatientProfile = {
  name: string;
  phone: string;
  timezone: string;
  emergencyContact: string;
  hasInsuranceUpload: boolean;
  hasHealthDataUpload: boolean;
};

export type ProviderProfile = {
  clinicName: string;
  clinicEmail: string;
  clinicCode: string;
  phone: string;
  timezone: string;
};

const RED_ACCENT = "#c94f47";
const STORAGE_KEY = "aida.demoState.v1";

const defaultPatientProfile: PatientProfile = {
  name: demoData.patient.name,
  phone: demoData.patient.phone,
  timezone: demoData.patient.timezone,
  emergencyContact: demoData.patient.emergencyContact,
  hasInsuranceUpload: false,
  hasHealthDataUpload: false,
};

const defaultProviderProfile: ProviderProfile = {
  clinicName: demoData.providers[0].name,
  clinicEmail: demoData.providerIntake.clinicEmail,
  clinicCode: demoData.providerIntake.clinicCode,
  phone: demoData.providers[0].phone,
  timezone: demoData.patient.timezone,
};

export function getHomeRouteForRole(role: AidaRole) {
  return role === "provider" ? "/(provider)/dashboard" : "/(patient)/home";
}

type ThemeState = {
  isReady: boolean;
  isLoggedIn: boolean;
  onboardingComplete: boolean;
  role: AidaRole;
  patientProfile: PatientProfile;
  providerProfile: ProviderProfile;
  mode: ModeName;
  language: string;
  notifications: boolean;
  calendarSync: boolean;
  login: () => void;
  logout: () => void;
  completeOnboarding: (state: {
    role: AidaRole;
    patientProfile?: Partial<PatientProfile>;
    providerProfile?: Partial<ProviderProfile>;
  }) => void;
  updatePatientProfile: (profile: Partial<PatientProfile>) => void;
  updateProviderProfile: (profile: Partial<ProviderProfile>) => void;
  setMode: (mode: ModeName) => void;
  setLanguage: (language: string) => void;
  setNotifications: (enabled: boolean) => void;
  setCalendarSync: (enabled: boolean) => void;
  theme: {
    accent: string;
    ink: string;
    muted: string;
    faint: string;
    line: string;
    wash: string;
    card: string;
    surface: string;
  };
};

const ThemeContext = createContext<ThemeState | null>(null);

export function AidaThemeProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [role, setRole] = useState<AidaRole>("patient");
  const [patientProfile, setPatientProfile] = useState<PatientProfile>(defaultPatientProfile);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile>(defaultProviderProfile);
  const [mode, setMode] = useState<ModeName>("light");
  const [language, setLanguage] = useState(demoData.patient.preferredLanguage.label);
  const [notifications, setNotifications] = useState(true);
  const [calendarSync, setCalendarSync] = useState(false);

  useEffect(() => {
    async function hydrate() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const saved = JSON.parse(raw) as Partial<{
          isLoggedIn: boolean;
          onboardingComplete: boolean;
          role: AidaRole;
          patientProfile: Partial<PatientProfile>;
          providerProfile: Partial<ProviderProfile>;
          mode: ModeName;
          language: string;
          notifications: boolean;
          calendarSync: boolean;
        }>;

        setIsLoggedIn(Boolean(saved.isLoggedIn));
        setOnboardingComplete(Boolean(saved.onboardingComplete));
        if (saved.role === "patient" || saved.role === "parent" || saved.role === "provider") {
          setRole(saved.role);
        }
        if (saved.mode === "light" || saved.mode === "dark") {
          setMode(saved.mode);
        }
        if (typeof saved.language === "string" && saved.language.length > 0) {
          setLanguage(saved.language);
        }
        if (typeof saved.notifications === "boolean") {
          setNotifications(saved.notifications);
        }
        if (typeof saved.calendarSync === "boolean") {
          setCalendarSync(saved.calendarSync);
        }
        if (saved.patientProfile) {
          setPatientProfile({ ...defaultPatientProfile, ...saved.patientProfile });
        }
        if (saved.providerProfile) {
          setProviderProfile({ ...defaultProviderProfile, ...saved.providerProfile });
        }
      } catch (error) {
        console.warn("Unable to load saved Aida state", error);
      } finally {
        setIsReady(true);
      }
    }

    void hydrate();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const state = {
      isLoggedIn,
      onboardingComplete,
      role,
      patientProfile,
      providerProfile,
      mode,
      language,
      notifications,
      calendarSync,
    };

    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error) => {
      console.warn("Unable to save Aida state", error);
    });
  }, [
    calendarSync,
    isLoggedIn,
    isReady,
    language,
    mode,
    notifications,
    onboardingComplete,
    patientProfile,
    providerProfile,
    role,
  ]);

  const login = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
  }, []);

  const updatePatientProfile = useCallback((profile: Partial<PatientProfile>) => {
    setPatientProfile((current) => ({ ...current, ...profile }));
  }, []);

  const updateProviderProfile = useCallback((profile: Partial<ProviderProfile>) => {
    setProviderProfile((current) => ({ ...current, ...profile }));
  }, []);

  const completeOnboarding = useCallback(
    ({
      role: nextRole,
      patientProfile: nextPatientProfile,
      providerProfile: nextProviderProfile,
    }: {
      role: AidaRole;
      patientProfile?: Partial<PatientProfile>;
      providerProfile?: Partial<ProviderProfile>;
    }) => {
      setIsLoggedIn(true);
      setOnboardingComplete(true);
      setRole(nextRole);
      if (nextPatientProfile) updatePatientProfile(nextPatientProfile);
      if (nextProviderProfile) updateProviderProfile(nextProviderProfile);
    },
    [updatePatientProfile, updateProviderProfile],
  );

  const theme = useMemo(() => {
    const accent = RED_ACCENT;
    if (mode === "dark") {
      return {
        accent,
        ink: "#f4f4f5",
        muted: "#a1a1aa",
        faint: "#71717a",
        line: "rgba(255,255,255,0.10)",
        wash: "#18181b",
        card: "#242428",
        surface: "#2f3035",
      };
    }
    return {
      accent,
      ink: colors.ink,
      muted: colors.muted,
      faint: colors.faint,
      line: colors.line,
      wash: colors.wash,
      card: colors.card,
      surface: "#f8fbfa",
    };
  }, [mode]);

  const value = useMemo(
    () => ({
      isReady,
      isLoggedIn,
      onboardingComplete,
      role,
      patientProfile,
      providerProfile,
      mode,
      language,
      notifications,
      calendarSync,
      login,
      logout,
      completeOnboarding,
      updatePatientProfile,
      updateProviderProfile,
      setMode,
      setLanguage,
      setNotifications,
      setCalendarSync,
      theme,
    }),
    [
      calendarSync,
      completeOnboarding,
      isLoggedIn,
      isReady,
      language,
      login,
      logout,
      mode,
      notifications,
      onboardingComplete,
      patientProfile,
      providerProfile,
      role,
      theme,
      updatePatientProfile,
      updateProviderProfile,
    ],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAidaTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useAidaTheme must be used inside AidaThemeProvider");
  }
  return value;
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export function Icon({
  name,
  size = 20,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: ColorValue;
}) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export function Screen({
  children,
  title,
  subtitle,
  action,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const { theme } = useAidaTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.wash }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {(title || subtitle || action) && (
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              {title && <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>}
              {subtitle && <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>}
            </View>
            {action}
          </View>
        )}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  const { theme } = useAidaTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.line },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function GlassCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  const { theme } = useAidaTheme();
  return <View style={[styles.glassCard, { backgroundColor: theme.card, borderColor: theme.line }, style]}>{children}</View>;
}

export function Pill({
  label,
  icon,
  tone,
}: {
  label: string;
  icon?: IconName;
  tone?: string;
}) {
  const { theme } = useAidaTheme();
  const pillTone = tone ?? theme.accent;
  return (
    <View style={[styles.pill, { backgroundColor: `${pillTone}18` }]}>
      {icon && <Icon name={icon} size={13} color={pillTone} />}
      <Text style={[styles.pillText, { color: pillTone }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  icon,
  onPress,
  href,
  disabled,
  tone,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  href?: string;
  disabled?: boolean;
  tone?: string;
}) {
  const { theme } = useAidaTheme();
  const buttonTone = tone ?? theme.accent;
  const content = (
    <View
      style={[
        styles.primaryButton,
        { backgroundColor: disabled ? theme.faint : buttonTone },
      ]}
    >
      {icon && <Icon name={icon} size={18} color="#fff" />}
      <Text style={styles.primaryButtonText}>{label}</Text>
    </View>
  );

  if (href) {
    return (
      <Link href={href as never} asChild>
        <Pressable disabled={disabled}>{content}</Pressable>
      </Link>
    );
  }

  return (
    <Pressable disabled={disabled} onPress={onPress}>
      {content}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  icon,
  onPress,
  href,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  href?: string;
}) {
  const { theme } = useAidaTheme();
  const content = (
    <View style={[styles.secondaryButton, { backgroundColor: theme.card, borderColor: theme.line }]}>
      {icon && <Icon name={icon} size={18} color={theme.accent} />}
      <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>{label}</Text>
    </View>
  );

  if (href) {
    return (
      <Link href={href as never} asChild>
        <Pressable>{content}</Pressable>
      </Link>
    );
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

export function MetricCard({
  icon,
  label,
  value,
  detail,
  flagged,
}: {
  icon: IconName;
  label: string;
  value: string;
  detail: string;
  flagged?: boolean;
}) {
  const { theme } = useAidaTheme();
  return (
    <Card style={styles.metricCard}>
      <View style={styles.metricTop}>
        <Icon name={icon} size={18} color={flagged ? colors.amber : theme.accent} />
        {flagged && <Pill label="Flagged" tone={colors.amber} />}
      </View>
      <Text style={[styles.metricValue, { color: theme.ink }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.ink }]}>{label}</Text>
      <Text style={[styles.metricDetail, { color: theme.muted }]}>{detail}</Text>
    </Card>
  );
}

export function StepDots({
  count,
  active,
}: {
  count: number;
  active: number;
}) {
  const { theme } = useAidaTheme();
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index <= active && { backgroundColor: theme.accent },
            index === active && styles.dotWide,
          ]}
        />
      ))}
    </View>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & {
  label: string;
}) {
  const { theme } = useAidaTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.faint}
        style={[
          styles.field,
          {
            backgroundColor: theme.card,
            borderColor: theme.line,
            color: theme.ink,
          },
        ]}
        {...props}
      />
    </View>
  );
}

export const sampleSummary = demoData.healthSummary.approvedSummary;

export const clinics = demoData.providers.map((provider) => ({
  name: provider.name,
  doctor: provider.doctor,
  distance: provider.distance,
  next: provider.nextAvailable,
  network: provider.network,
}));

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.wash,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.2,
    fontFamily: fonts.display,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
    fontFamily: fonts.body,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(23,33,31,0.06)",
    shadowColor: "#0f201d",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    fontFamily: fonts.body,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
  },
  secondaryButtonText: {
    color: colors.teal,
    fontSize: 15,
    fontWeight: "800",
    fontFamily: fonts.body,
  },
  metricCard: {
    flex: 1,
    minHeight: 150,
  },
  metricTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  metricValue: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "700",
    fontFamily: fonts.display,
  },
  metricLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
    fontFamily: fonts.body,
  },
  metricDetail: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
    fontFamily: fonts.body,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 6,
    backgroundColor: "#c9d3cf",
  },
  dotActive: {
    backgroundColor: colors.teal,
  },
  dotWide: {
    width: 22,
  },
  fieldWrap: {
    gap: 7,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontFamily: fonts.body,
  },
  field: {
    minHeight: 50,
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.body,
  },
});
