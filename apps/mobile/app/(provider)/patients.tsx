import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { demoData } from "@aida/shared";
import { Card, Icon, Pill, Screen, colors, sampleSummary, useAidaTheme, PrimaryButton } from "../../components/aida";

const patients = demoData.providerIntake.patientRoster;

const filters = ["All", "Needs review", "Confirmed", "Flagged"];

export default function ProviderPatientsScreen() {
  const { theme } = useAidaTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(patients[0]);
  const [notes, setNotes] = useState("");

  const filtered = useMemo(() => {
    return patients.filter((patient) => {
      const matchesQuery = [patient.name, patient.reason, patient.specialty, patient.language]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesFilter =
        filter === "All" ||
        patient.status === filter ||
        (filter === "Flagged" && patient.flagged);
      return matchesQuery && matchesFilter;
    });
  }, [filter, query]);

  return (
    <Screen title="Patient intake" subtitle="Search patients and review approved summaries.">
      <View style={{ gap: 14, paddingBottom: 86 }}>
        <View
          style={{
            borderRadius: 18,
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.line,
            paddingHorizontal: 14,
            minHeight: 50,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icon name="magnify" color={theme.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, reason, language"
            placeholderTextColor={theme.faint}
            style={{ flex: 1, color: theme.ink, fontWeight: "700" }}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {filters.map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)}>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: filter === item ? theme.accent : theme.surface,
                  borderWidth: 1,
                  borderColor: filter === item ? theme.accent : theme.line,
                }}
              >
                <Text
                  style={{
                    color: filter === item ? "#fff" : theme.ink,
                    fontWeight: "900",
                  }}
                >
                  {item}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Card>
          <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900", marginBottom: 10 }}>
            Patients
          </Text>
          {filtered.map((patient, index) => (
            <Pressable key={patient.name} onPress={() => setSelected(patient)}>
              <View
                style={{
                  paddingVertical: 12,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: theme.line,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 16,
                    backgroundColor: selected.name === patient.name ? `${theme.accent}18` : theme.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="account-heart" color={selected.name === patient.name ? theme.accent : theme.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900" }}>{patient.name}</Text>
                  <Text style={{ color: theme.muted, marginTop: 3 }}>{patient.time} - {patient.reason}</Text>
                </View>
                <Pill
                  label={patient.flagged ? "Flagged" : patient.status}
                  tone={patient.flagged ? colors.amber : patient.status === "Completed" ? colors.faint : theme.accent}
                />
              </View>
            </Pressable>
          ))}
        </Card>

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Icon name="file-document-check" color={theme.accent} size={24} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 18, fontWeight: "900" }}>{selected.name}</Text>
              <Text style={{ color: theme.muted, marginTop: 3 }}>
                Age {selected.age} - {selected.language} - {selected.insurance}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <Pill label={selected.specialty} icon="stethoscope" />
            <Pill label={selected.status} icon="clipboard-text-clock-outline" tone={colors.plum} />
            {selected.flagged && <Pill label="Vitals flagged" icon="heart-pulse" tone={colors.amber} />}
          </View>
          <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900", marginTop: 18 }}>
            Approved summary
          </Text>
          <Text style={{ color: theme.muted, lineHeight: 22, marginTop: 8 }}>{sampleSummary}</Text>
        </Card>

        <Card>
          <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900", marginBottom: 10 }}>
            Clinical Notes
          </Text>
          <TextInput
            multiline
            numberOfLines={4}
            placeholder="Post-visit documentation..."
            placeholderTextColor={theme.faint}
            value={notes}
            onChangeText={setNotes}
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.line,
              borderWidth: 1,
              borderRadius: 14,
              padding: 14,
              color: theme.ink,
              minHeight: 100,
              textAlignVertical: "top",
              marginBottom: 14,
            }}
          />
          <PrimaryButton
            label="Save Notes"
            icon="content-save-outline"
            onPress={() => {
              // Simulates write back to MongoDB
              alert("Notes saved to database");
            }}
          />
        </Card>
      </View>
    </Screen>
  );
}
