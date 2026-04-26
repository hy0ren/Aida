import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { demoData, type AppointmentResponse, type SummaryHistoryItem } from "@aida/shared";
import { listAppointments, listSummaries, saveProviderNotes } from "../../lib/api";
import {
  Card,
  Icon,
  Pill,
  Screen,
  colors,
  sampleSummary,
  useAidaTheme,
  PrimaryButton,
} from "../../components/aida";

const filters = ["All", "Needs review", "Confirmed", "Flagged"];

export default function ProviderPatientsScreen() {
  const { theme, patientProfile, language, userId } = useAidaTheme();
  const patientName = `${patientProfile.firstName} ${patientProfile.lastName}`.trim();
  const patientId = userId ?? demoData.patient.id;

  const [realSummary, setRealSummary] = useState<SummaryHistoryItem | null>(null);
  const [realAppts, setRealAppts] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      listSummaries(patientId),
      listAppointments(patientId),
    ]).then(([sumResult, apptResult]) => {
      if (!mounted) return;
      if (sumResult.status === "fulfilled" && sumResult.value.items.length > 0) {
        setRealSummary(sumResult.value.items[0]);
      }
      if (apptResult.status === "fulfilled") {
        setRealAppts(apptResult.value.items);
      }
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [patientId]);

  const displaySummary = realSummary?.summary
    ?? sampleSummary
      .replace(/Elena Morales/g, patientName)
      .replace(/Elena/g, patientProfile.firstName)
      .replace(/Spanish/g, language);

  const patients = useMemo(
    () =>
      demoData.providerIntake.patientRoster.map((patient, index) =>
        index === 0
          ? { ...patient, name: patientName, language }
          : patient,
      ),
    [language, patientName],
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(patients[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

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
  }, [filter, patients, query]);

  const selectedAppt = realAppts.find(
    (a) => a.status === "confirmed" || a.status === "pending",
  ) ?? realAppts[0];

  async function handleSaveNotes() {
    if (!selectedAppt?.appointmentId) {
      Alert.alert("Saved", "Notes saved locally (no appointment to attach to).");
      return;
    }
    setSaving(true);
    try {
      await saveProviderNotes({
        appointmentId: selectedAppt.appointmentId,
        providerNotes: notes,
      });
      Alert.alert("Saved", "Clinical notes saved to patient record.");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to save notes.");
    } finally {
      setSaving(false);
    }
  }

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
            {realSummary?.source && (
              <Pill
                label={realSummary.source === "gemini" ? "Gemini summary" : "Demo summary"}
                icon="brain"
                tone={realSummary.source === "gemini" ? colors.green : colors.faint}
              />
            )}
          </View>
          <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900", marginTop: 18 }}>
            Approved summary
          </Text>
          {loading ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: 12 }} />
          ) : (
            <Text style={{ color: theme.muted, lineHeight: 22, marginTop: 8 }}>{displaySummary}</Text>
          )}

          {selectedAppt && (
            <View style={{ marginTop: 16, gap: 6 }}>
              <Text style={{ color: theme.ink, fontSize: 14, fontWeight: "900" }}>Appointment</Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Pill label={selectedAppt.doctor} icon="doctor" tone={colors.plum} />
                <Pill label={formatApptTime(selectedAppt.scheduledAt)} icon="calendar" />
                <Pill label={selectedAppt.status} icon="check" tone={colors.green} />
              </View>
            </View>
          )}
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
            label={saving ? "Saving..." : "Save Notes"}
            icon="content-save-outline"
            disabled={saving}
            onPress={handleSaveNotes}
          />
        </Card>
      </View>
    </Screen>
  );
}

function formatApptTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
