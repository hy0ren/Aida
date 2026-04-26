import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { demoData, type InsuranceVerificationResponse, type ProviderOption } from "@aida/shared";
import { findProviders, verifyInsurance } from "../../lib/api";
import {
  Card,
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
  const selectedProvider = providers[selected];

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
    <Screen
      title={t("schedule")}
      subtitle={t("scheduleSubtitle")}
    >
      <View style={{ gap: 16, paddingBottom: 86 }}>
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
  );
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
