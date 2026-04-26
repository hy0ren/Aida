import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  demoData,
  type AppointmentResponse,
  type InsuranceVerificationResponse,
  type ProviderOption,
} from "@aida/shared";
import { AppointmentDetailSheet } from "../../components/AppointmentDetailSheet";
import { findProviders, listAppointments, verifyInsurance } from "../../lib/api";
import { byScheduledAtAsc, isUpcomingBookSlot, matchesAppointmentSearch } from "../../lib/appointment-filters";
import { buildDemoActiveAppointment } from "../../lib/demo-appointment";
import {
  Card,
  Field,
  Icon,
  Pill,
  PrimaryButton,
  Screen,
  colors,
  useAidaTheme,
} from "../../components/aida";

export default function BookScreen() {
  const [selected, setSelected] = useState(0);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [recommendedVisit, setRecommendedVisit] = useState(demoData.healthSummary.suggestedVisit);
  const [providerState, setProviderState] = useState<"loading" | "success" | "error">("loading");
  const [insuranceState, setInsuranceState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [insurance, setInsurance] = useState<InsuranceVerificationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { theme, userId, language, t } = useAidaTheme();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [apptState, setApptState] = useState<"loading" | "success">("loading");
  const [apptSearch, setApptSearch] = useState("");
  const [sheetAppt, setSheetAppt] = useState<AppointmentResponse | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const selectedProvider = providers[selected];
  const patientId = userId ?? demoData.patient.id;
  const demoUpcoming = useMemo(() => buildDemoActiveAppointment(patientId), [patientId]);

  const loadAppointments = useCallback(() => {
    setApptState("loading");
    listAppointments(patientId)
      .then((r) => {
        setAppointments(r.items);
        setApptState("success");
      })
      .catch(() => {
        setAppointments([]);
        setApptState("success");
      });
  }, [patientId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments]),
  );

  const hasRealAppointments = appointments.length > 0;
  const upcomingFromApi = useMemo(() => {
    return appointments
      .filter(isUpcomingBookSlot)
      .filter((a) => matchesAppointmentSearch(a, apptSearch))
      .sort(byScheduledAtAsc);
  }, [appointments, apptSearch]);

  const showDemoUpcoming = apptState === "success" && !hasRealAppointments;
  const showDemoRow =
    showDemoUpcoming && isUpcomingBookSlot(demoUpcoming) && matchesAppointmentSearch(demoUpcoming, apptSearch);

  useEffect(() => {
    let mounted = true;

    findProviders({ summaryId: demoData.healthSummary.id, patientId: userId ?? demoData.patient.id, language })
      .then((response) => {
        if (!mounted) return;
        setProviders(response.providers);
        setRecommendedVisit(response.recommendedVisit);
        setProviderState("success");
      })
      .catch((error) => {
        if (!mounted) return;
        setProviders(
          demoData.providers.map((provider) => ({
            id: provider.id,
            name: provider.name,
            doctor: provider.doctor,
            specialty: provider.specialty,
            distance: provider.distance,
            address: provider.address,
            phone: provider.phone,
            nextAvailable: provider.nextAvailable,
            networkStatus: provider.network === "In-network" ? "in-network" : "review-plan",
            languages: ["English", language],
          })),
        );
        setProviderState("error");
        setErrorMessage(error instanceof Error ? error.message : t("showingDemoProviders", { error: "" }));
      });

    return () => {
      mounted = false;
    };
  }, [language, userId]);

  useEffect(() => {
    if (!selectedProvider) return;

    let mounted = true;
    setInsuranceState("loading");

    verifyInsurance({ providerId: selectedProvider.id, patientId: userId ?? demoData.patient.id })
      .then((response) => {
        if (!mounted) return;
        setInsurance(response);
        setInsuranceState("success");
      })
      .catch((error) => {
        if (!mounted) return;
        setInsuranceState("error");
        setErrorMessage(error instanceof Error ? error.message : t("error"));
      });

    return () => {
      mounted = false;
    };
  }, [selectedProvider, userId]);

  return (
    <>
    <Screen
      title={t("schedule")}
      subtitle={t("scheduleSubtitle")}
    >
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card>
          <Text style={{ color: theme.ink, fontSize: 17, fontWeight: "900", marginBottom: 4 }}>
            {t("upcomingAppointmentsSection")}
          </Text>
          <Text style={{ color: theme.muted, lineHeight: 20, marginBottom: 10 }}>
            {t("upcomingAppointmentsBookHelp")}
          </Text>
          {apptState === "loading" ? <ActivityIndicator color={theme.accent} style={{ marginVertical: 8 }} /> : null}
          {(hasRealAppointments || showDemoUpcoming) && (
            <Field
              label={t("searchAppointments")}
              value={apptSearch}
              onChangeText={setApptSearch}
              placeholder={t("searchAppointments")}
            />
          )}
          {hasRealAppointments && upcomingFromApi.length === 0 && apptSearch.trim() ? (
            <Text style={{ color: theme.muted, marginTop: 8 }}>{t("noAppointmentsMatch")}</Text>
          ) : hasRealAppointments && appointments.filter(isUpcomingBookSlot).length === 0 ? (
            <Text style={{ color: theme.muted, marginTop: 8 }}>{t("noUpcomingAppointments")}</Text>
          ) : null}
          {upcomingFromApi.map((appt) => (
            <Pressable
              key={appt.appointmentId}
              onPress={() => {
                setSheetAppt(appt);
                setSheetOpen(true);
              }}
              style={{ marginTop: 10 }}
            >
              <View
                style={{
                  borderWidth: 1,
                  borderColor: theme.line,
                  borderRadius: 16,
                  padding: 14,
                  backgroundColor: theme.card,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900" }}>{appt.clinicName}</Text>
                    <Text style={{ color: theme.muted, marginTop: 4 }}>{formatUpcomingTime(appt.scheduledAt)}</Text>
                  </View>
                  <Pill label={appt.status} icon="calendar-clock" />
                </View>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  <Pill label={appt.doctor} icon="doctor" tone={colors.plum} />
                  <Pill label={appt.specialty} icon="stethoscope" tone={colors.amber} />
                </View>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 8 }}>{t("tapForDetails")}</Text>
              </View>
            </Pressable>
          ))}
          {showDemoRow && (
            <Pressable
              onPress={() => {
                setSheetAppt(demoUpcoming);
                setSheetOpen(true);
              }}
              style={{ marginTop: 10 }}
            >
              <View
                style={{
                  borderWidth: 1,
                  borderColor: theme.line,
                  borderRadius: 16,
                  padding: 14,
                  backgroundColor: theme.card,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900" }}>{demoData.providers[0].name}</Text>
                    <Text style={{ color: theme.muted, marginTop: 4 }}>{demoData.selectedAppointment.displayDateTime}</Text>
                  </View>
                  <Pill label="confirmed" icon="calendar-clock" />
                </View>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  <Pill label={demoData.providers[0].doctor} icon="doctor" tone={colors.plum} />
                  <Pill label={demoData.selectedAppointment.visitType} icon="stethoscope" tone={colors.amber} />
                </View>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 8 }}>{t("tapForDetails")}</Text>
              </View>
            </Pressable>
          )}
          {showDemoUpcoming && !showDemoRow && apptSearch.trim() ? (
            <Text style={{ color: theme.muted, marginTop: 8 }}>{t("noAppointmentsMatch")}</Text>
          ) : null}
        </Card>

        <Card style={{ backgroundColor: theme.surface }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Icon name="alert-circle-outline" size={24} color={colors.amber} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900" }}>
                {t("suggestedVisit")}
              </Text>
              <Text style={{ color: theme.muted, lineHeight: 20, marginTop: 4 }}>
                {recommendedVisit}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={[sectionTitle, { color: theme.ink }]}>{t("insuranceCheck")}</Text>
          <ApiStatus state={insuranceState} error={errorMessage} />
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Pill label={insurance?.insurance.carrier ?? demoData.insurance.detectedLabel} icon="card-account-details" />
            <Pill
              label={t("estimatedCopay", { amount: insurance?.insurance.estimatedCopay ?? 25 })}
              icon="cash"
              tone={colors.green}
            />
            <Pill
              label={insurance?.eligible ? t("verifiedInNetwork") : demoData.insurance.networkStatus}
              icon="check"
              tone={theme.accent}
            />
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          {providerState === "loading" && (
            <Card style={{ backgroundColor: theme.surface }}>
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <ActivityIndicator color={theme.accent} />
                <Text style={{ color: theme.ink, fontWeight: "800" }}>{t("findingProviders")}</Text>
              </View>
            </Card>
          )}
          {providerState === "error" && (
            <Card style={{ backgroundColor: `${colors.red}10`, borderColor: `${colors.red}44` }}>
              <Text style={{ color: theme.ink, fontWeight: "800", lineHeight: 20 }}>
                {t("showingDemoProviders", { error: errorMessage })}
              </Text>
            </Card>
          )}
          {providers.map((clinic, index) => {
            const active = selected === index;
            return (
              <Pressable key={clinic.id} onPress={() => setSelected(index)}>
                <Card
                  style={{
                    borderColor: active ? theme.accent : theme.line,
                    borderWidth: active ? 1.5 : 1,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: active ? `${theme.accent}18` : theme.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="hospital-building" size={24} color={active ? theme.accent : theme.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900" }}>
                        {clinic.name}
                      </Text>
                      <Text style={{ color: theme.muted, marginTop: 3 }}>
                        {clinic.doctor}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                        <Pill label={clinic.distance} icon="map-marker" tone={colors.faint} />
                        <Pill
                          label={clinic.networkStatus === "in-network" ? t("inNetwork") : t("reviewPlan")}
                          icon="shield-check"
                        />
                        <Pill label={formatSlot(clinic.nextAvailable)} icon="calendar-clock" tone={colors.plum} />
                      </View>
                    </View>
                    {active && <Icon name="check-circle" size={22} color={theme.accent} />}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          href={`/(patient)/call-status?providerId=${selectedProvider?.id ?? ""}`}
          icon="phone"
          label={insuranceState === "loading" ? t("verifyingInsurance") : t("bookWithAiAgent")}
          disabled={!selectedProvider || insuranceState === "loading"}
        />
      </View>
    </Screen>
    <AppointmentDetailSheet
      visible={sheetOpen}
      onClose={() => {
        setSheetOpen(false);
        setSheetAppt(null);
      }}
      appointment={sheetAppt}
      patientId={patientId}
      allowCancel={
        !showDemoUpcoming || (sheetAppt != null && sheetAppt.appointmentId !== demoUpcoming.appointmentId)
      }
      onCancelled={loadAppointments}
    />
    </>
  );
}

function formatUpcomingTime(value: string) {
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

function ApiStatus({
  state,
  error,
}: {
  state: "idle" | "loading" | "success" | "error";
  error: string;
}) {
  const { theme, t } = useAidaTheme();

  if (state === "idle") return null;

  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 12 }}>
      {state === "loading" ? (
        <ActivityIndicator color={theme.accent} />
      ) : (
        <Icon
          name={state === "success" ? "check-circle" : "alert-circle-outline"}
          size={18}
          color={state === "success" ? colors.green : colors.red}
        />
      )}
      <Text style={{ color: theme.muted, flex: 1, lineHeight: 18, fontWeight: "700" }}>
        {state === "loading"
          ? t("checkingEligibility")
          : state === "success"
            ? t("eligibilityVerified")
            : error}
      </Text>
    </View>
  );
}

function formatSlot(value: string) {
  if (!value?.trim() || !value.includes("T")) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return value;
  }
}

const sectionTitle = {
  fontSize: 17,
  fontWeight: "900" as const,
  marginBottom: 12,
};
