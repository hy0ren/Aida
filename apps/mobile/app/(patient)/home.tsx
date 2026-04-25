import { Text, View } from "react-native";
import {
  Card,
  Icon,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
  colors,
  fonts,
  useAidaTheme,
} from "../../components/aida";
import type { ComponentProps } from "react";

type MetricTone = "attention" | "stable";
type MetricIcon = ComponentProps<typeof Icon>["name"];

const todaysMetrics: {
  icon: MetricIcon;
  label: string;
  value: string;
  unit?: string;
  detail: string;
  tone: MetricTone;
  wide?: boolean;
}[] = [
  {
    icon: "heart-pulse",
    label: "Resting heart rate",
    value: "78",
    unit: "bpm",
    detail: "+12 above your usual morning range",
    tone: "attention",
  },
  {
    icon: "sleep",
    label: "Sleep score",
    value: "65",
    unit: "/100",
    detail: "Lower than your 7-day average",
    tone: "attention",
  },
  {
    icon: "chart-bell-curve",
    label: "HRV",
    value: "42",
    unit: "ms",
    detail: "Down 18% from your baseline",
    tone: "attention",
  },
  {
    icon: "shoe-print",
    label: "Steps",
    value: "5,240",
    detail: "On track for your weekday goal",
    tone: "stable",
  },
  {
    icon: "lungs",
    label: "Blood oxygen",
    value: "97",
    unit: "%",
    detail: "Within your normal range",
    tone: "stable",
    wide: true,
  },
];

export default function HomeScreen() {
  const { theme, mode, language } = useAidaTheme();
  return (
    <Screen
      title="Biometrics"
      subtitle="Good morning, Maria. Your recent data is ready for review."
      action={<Pill label={language} icon="translate" tone={colors.plum} />}
    >
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card style={{ backgroundColor: mode === "dark" ? "#2f3035" : colors.ink }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#b7cbc5", fontSize: 13, fontWeight: "800" }}>
                Health status
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: "900",
                  marginTop: 6,
                  lineHeight: 33,
                }}
              >
                3 vitals need attention
              </Text>
              <Text style={{ color: "#d9e6e2", fontSize: 14, lineHeight: 21, marginTop: 8 }}>
                Resting heart rate, sleep score, and HRV changed from your normal range.
              </Text>
            </View>
            <Icon name="heart-pulse" size={44} color="#d7fff3" />
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
            <Pill label="Last sync: Today" icon="sync" tone="#d7fff3" />
            <Pill label="On-device" icon="shield-check" tone="#d7fff3" />
          </View>
        </Card>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <PrimaryButton href="/(patient)/upload" icon="cloud-upload" label="Upload data" />
          <SecondaryButton href="/(patient)/book" icon="calendar-plus" label="Book" />
        </View>

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${theme.accent}14`,
              }}
            >
              <Icon name="calendar-clock" size={22} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[sectionTitle, { color: theme.ink, marginBottom: 4 }]}>
                Next appointment
              </Text>
              <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900" }}>
                Dr. Lin Chen
              </Text>
              <Text style={{ color: theme.muted, marginTop: 4 }}>
                Wed, May 6 at 2:30 PM
              </Text>
            </View>
            <Pill label="Confirmed" icon="check" />
          </View>
        </Card>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[sectionTitle, { color: theme.ink, marginBottom: 4 }]}>
                Today’s metrics
              </Text>
              <Text style={{ color: theme.muted, fontSize: 14, lineHeight: 20 }}>
                Most recent readings from your wearable and phone.
              </Text>
            </View>
            <Pill label="5 updated" icon="sync" tone={mode === "dark" ? "#d7fff3" : colors.green} />
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {todaysMetrics.map((metric) => (
              <TodayMetricCard key={metric.label} {...metric} />
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}

function TodayMetricCard({
  icon,
  label,
  value,
  unit,
  detail,
  tone,
  wide,
}: (typeof todaysMetrics)[number]) {
  const { theme, mode } = useAidaTheme();
  const isFlagged = tone === "attention";
  const accent = isFlagged ? colors.amber : colors.green;
  const softFill = mode === "dark" ? `${accent}24` : `${accent}14`;

  return (
    <Card
      style={{
        width: wide ? "100%" : "48%",
        minHeight: wide ? 128 : 172,
        padding: 16,
        borderColor: isFlagged ? accent : theme.line,
        backgroundColor: isFlagged && mode === "light" ? "#fffaf2" : theme.card,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 13,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: softFill,
          }}
        >
          <Icon name={icon} size={21} color={accent} />
        </View>
        {isFlagged ? (
          <Pill label="Review" icon="alert-circle" tone={accent} />
        ) : (
          <Pill label="Stable" icon="check-circle" tone={accent} />
        )}
      </View>

      <View style={{ marginTop: wide ? 14 : 18 }}>
        <Text
          style={{
            color: theme.ink,
            fontSize: wide ? 42 : 40,
            lineHeight: wide ? 48 : 45,
            fontWeight: "700",
            fontFamily: fonts.display,
          }}
        >
          {value}
          {unit && (
            <Text
              style={{
                color: theme.muted,
                fontSize: wide ? 18 : 16,
                fontWeight: "800",
                fontFamily: fonts.body,
              }}
            >
              {" "}
              {unit}
            </Text>
          )}
        </Text>
        <Text style={{ color: theme.ink, fontSize: 15, fontWeight: "900", marginTop: 4 }}>
          {label}
        </Text>
        <Text style={{ color: theme.muted, fontSize: 12, lineHeight: 17, marginTop: 6 }}>
          {detail}
        </Text>
      </View>
    </Card>
  );
}

const sectionTitle = {
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 12,
};
