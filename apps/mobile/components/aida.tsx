import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
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
  teal: "#0f766e",
  plum: "#6e3a6e",
  amber: "#d58a41",
  green: "#2f855a",
  red: "#b54735",
};

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
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {(title || subtitle || action) && (
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
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
  return <View style={[styles.card, style]}>{children}</View>;
}

export function GlassCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

export function Pill({
  label,
  icon,
  tone = colors.teal,
}: {
  label: string;
  icon?: IconName;
  tone?: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: `${tone}14` }]}>
      {icon && <Icon name={icon} size={13} color={tone} />}
      <Text style={[styles.pillText, { color: tone }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  icon,
  onPress,
  href,
  disabled,
  tone = colors.teal,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  href?: string;
  disabled?: boolean;
  tone?: string;
}) {
  const content = (
    <View
      style={[
        styles.primaryButton,
        { backgroundColor: disabled ? colors.faint : tone },
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
  const content = (
    <View style={styles.secondaryButton}>
      {icon && <Icon name={icon} size={18} color={colors.teal} />}
      <Text style={styles.secondaryButtonText}>{label}</Text>
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
  return (
    <Card style={styles.metricCard}>
      <View style={styles.metricTop}>
        <Icon name={icon} size={18} color={flagged ? colors.amber : colors.teal} />
        {flagged && <Pill label="Flagged" tone={colors.amber} />}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
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
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index <= active && styles.dotActive,
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
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#98a5a1"
        style={styles.field}
        {...props}
      />
    </View>
  );
}

export const sampleSummary =
  "Your resting heart rate has been elevated for three days, while sleep quality and HRV are trending lower. This can happen with stress, illness, or cardiovascular strain. Share fatigue, dizziness, chest tightness, or shortness of breath with your doctor.";

export const clinics = [
  {
    name: "Bayview Family Medicine",
    doctor: "Dr. Lin Chen",
    distance: "0.4 mi",
    next: "Wed 2:30 PM",
    network: "In-network",
  },
  {
    name: "Mission Heart & Vascular",
    doctor: "Dr. Ruth Okonkwo",
    distance: "1.1 mi",
    next: "Thu 9:00 AM",
    network: "In-network",
  },
  {
    name: "Sunset Internal Medicine",
    doctor: "Dr. Paula Vasquez",
    distance: "2.0 mi",
    next: "Fri 11:00 AM",
    network: "Review plan",
  },
];

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
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
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
    fontWeight: "900",
  },
  metricLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  metricDetail: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
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
  },
});
