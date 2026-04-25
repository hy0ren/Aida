import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Card, Field, Icon, Pill, Screen, colors, sampleSummary, useAidaTheme } from "../../components/aida";

export default function ProviderPatientsScreen() {
  const { theme, language } = useAidaTheme();
  const [notes, setNotes] = useState("Ask about fatigue onset, chest pressure, hydration, and recent illness.");

  return (
    <Screen title="Patient intake" subtitle="Approved summary and visit context.">
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: `${theme.accent}18`, alignItems: "center", justifyContent: "center" }}>
              <Icon name="account-heart" size={30} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 19, fontWeight: "900" }}>Maria Rivera</Text>
              <Text style={{ color: theme.muted, marginTop: 3 }}>DOB 04/14/1987 - {language} preferred</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <Pill label="Aetna POS II" icon="card-account-details" />
            <Pill label="$25 copay" icon="cash" tone={colors.green} />
            <Pill label="Needs review" icon="alert-circle-outline" tone={colors.amber} />
          </View>
        </Card>

        <Card>
          <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900", marginBottom: 10 }}>
            Patient-approved biometric summary
          </Text>
          <Text style={{ color: theme.muted, lineHeight: 22 }}>{sampleSummary}</Text>
        </Card>

        <Card>
          <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>
            Key metrics
          </Text>
          <MetricRow label="Resting heart rate" value="78 bpm (+12)" tone={colors.amber} />
          <MetricRow label="Sleep score" value="65 / 100" tone={colors.amber} />
          <MetricRow label="HRV" value="42 ms" tone={colors.amber} />
          <MetricRow label="Blood oxygen" value="97%" tone={colors.green} />
        </Card>

        <Card>
          <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>
            Provider notes
          </Text>
          <TextInput
            multiline
            value={notes}
            onChangeText={setNotes}
            style={{
              minHeight: 120,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.line,
              color: theme.ink,
              backgroundColor: theme.surface,
              padding: 14,
              textAlignVertical: "top",
              lineHeight: 21,
            }}
          />
        </Card>
      </View>
    </Screen>
  );
}

function MetricRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  const { theme } = useAidaTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
      <Text style={{ flex: 1, color: theme.muted, fontWeight: "700" }}>{label}</Text>
      <Pill label={value} tone={tone} />
    </View>
  );
}
