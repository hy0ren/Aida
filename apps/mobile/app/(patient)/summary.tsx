import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import {
  Card,
  MetricCard,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
  colors,
  sampleSummary,
  useAidaTheme,
} from "../../components/aida";

export default function SummaryScreen() {
  const [summary, setSummary] = useState(sampleSummary);
  const { theme, language } = useAidaTheme();

  return (
    <Screen
      title="Review summary"
      subtitle="Nothing is sent to a clinic until you approve it."
      action={<Pill label="On-device" icon="shield-check" />}
    >
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <MetricCard
            icon="heart"
            label="Resting HR"
            value="78"
            detail="+12 above normal"
            flagged
          />
          <MetricCard
            icon="sleep"
            label="Sleep"
            value="65"
            detail="Lower than usual"
            flagged
          />
        </View>

        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>Summary for your doctor</Text>
          <TextInput
            multiline
            value={summary}
            onChangeText={setSummary}
            style={{
              minHeight: 170,
              color: theme.ink,
              fontSize: 15,
              lineHeight: 23,
              textAlignVertical: "top",
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 14,
            }}
          />
          <Text style={{ color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 10 }}>
            You can edit this before it is attached to the appointment request.
          </Text>
        </Card>

        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>What will be shared</Text>
          <View style={{ gap: 8 }}>
            <Pill label="Approved summary" icon="check" />
            <Pill label="Insurance details" icon="card-account-details" tone={colors.plum} />
            <Pill label={`Preferred language: ${language}`} icon="translate" tone={colors.amber} />
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          <PrimaryButton href="/(patient)/book" icon="check" label="Approve and continue" />
          <SecondaryButton href="/(patient)/upload" icon="pencil" label="Edit uploads" />
        </View>
      </View>
    </Screen>
  );
}

const sectionTitle = {
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 12,
};
