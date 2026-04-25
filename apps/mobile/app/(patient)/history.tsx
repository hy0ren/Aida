import { Text, View } from "react-native";
import { Card, Icon, Pill, Screen, colors, sampleSummary } from "../../components/aida";

export default function HistoryScreen() {
  return (
    <Screen
      title="History"
      subtitle="Appointments, summaries, and SMS receipts stay organized here."
    >
      <View style={{ gap: 14, paddingBottom: 86 }}>
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900" }}>
                Bayview Family Medicine
              </Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                Wed, May 6 at 2:30 PM
              </Text>
            </View>
            <Pill label="Upcoming" icon="calendar-clock" />
          </View>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <Pill label="Dr. Lin Chen" icon="doctor" tone={colors.plum} />
            <Pill label="General care" icon="stethoscope" tone={colors.amber} />
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Icon name="file-document-check" size={23} color={colors.teal} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "900" }}>
                Approved biometric summary
              </Text>
              <Text style={{ color: colors.muted, lineHeight: 20, marginTop: 6 }}>
                {sampleSummary}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "900" }}>
            Past visits
          </Text>
          {["Annual checkup", "Pediatric asthma follow-up", "Lab results review"].map(
            (item, index) => (
              <View
                key={item}
                style={{
                  paddingTop: 14,
                  marginTop: 14,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.line,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon name="clipboard-text-clock-outline" color={colors.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.ink, fontWeight: "800" }}>{item}</Text>
                  <Text style={{ color: colors.muted, marginTop: 2 }}>Completed</Text>
                </View>
                <Icon name="chevron-right" color={colors.faint} />
              </View>
            ),
          )}
        </Card>
      </View>
    </Screen>
  );
}
