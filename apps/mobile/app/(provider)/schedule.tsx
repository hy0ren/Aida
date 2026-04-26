import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { demoData } from "@aida/shared";
import { Card, Icon, Pill, Screen, colors, useAidaTheme } from "../../components/aida";

export default function ScheduleManagementScreen() {
  const { theme, patientProfile } = useAidaTheme();
  const patientName = `${patientProfile.firstName} ${patientProfile.lastName}`.trim();
  const slots = demoData.providerIntake.scheduleSlots.map((slot, index) =>
    index === 0 ? { ...slot, patient: patientName } : slot,
  );
  const visits = demoData.appointmentHistory.map((visit, index) =>
    index === 0 ? { ...visit, patientName } : visit,
  );
  const [view, setView] = useState<"schedule" | "history">("schedule");

  return (
    <Screen title="Schedule" subtitle="Manage availability and review appointment history.">
      <View style={{ gap: 14, paddingBottom: 86 }}>
        <View
          style={{
            flexDirection: "row",
            padding: 4,
            borderRadius: 18,
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.line,
          }}
        >
          {(["schedule", "history"] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setView(item)}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: view === item ? theme.accent : "transparent",
              }}
            >
              <Text
                style={{
                  color: view === item ? "#fff" : theme.ink,
                  fontWeight: "900",
                }}
              >
                {item === "schedule" ? "Schedule" : "History"}
              </Text>
            </Pressable>
          ))}
        </View>

        {view === "schedule" ? (
          <>
            <Card>
              <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>
                Availability rules
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Pill label="English calls" icon="phone" />
                <Pill label={demoData.insurance.acceptedLabel} icon="shield-check" tone={colors.green} />
                <Pill label="15 min buffer" icon="timer-outline" tone={colors.plum} />
              </View>
            </Card>

            {slots.map((slot) => (
              <Pressable key={slot.time}>
                <Card>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Icon name="calendar-clock" size={24} color={theme.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900" }}>
                        {slot.time}
                      </Text>
                      <Text style={{ color: theme.muted, marginTop: 3 }}>{slot.patient}</Text>
                    </View>
                    <Pill
                      label={slot.status}
                      tone={slot.status === "Open" ? colors.green : slot.status === "Held" ? colors.amber : theme.accent}
                    />
                  </View>
                </Card>
              </Pressable>
            ))}
          </>
        ) : (
          visits.map((visit, index) => (
            <Card key={visit.id}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Icon name="clipboard-text-clock-outline" size={24} color={theme.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900" }}>{visit.patientName}</Text>
                  <Text style={{ color: theme.muted, marginTop: 3 }}>{visit.reason}</Text>
                </View>
                <Pill label={visit.dateTime} tone={index === 0 ? theme.accent : colors.faint} />
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
