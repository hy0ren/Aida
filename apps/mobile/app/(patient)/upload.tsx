import { useRouter } from "expo-router";
import { demoData } from "@aida/shared";
import * as DocumentPicker from "expo-document-picker";
import { readAsStringAsync, EncodingType } from "expo-file-system/legacy";
import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { uploadPatientIntake } from "../../lib/api";
import type { I18nKey } from "../../lib/i18n";
import {
  DEVICE_SYNC_SOURCES,
  formatIngestedBytes,
  loadSyncedHealth,
  saveSyncedFromSource,
  type HealthSyncRunStats,
} from "../../lib/synced-health-data";
import {
  Card,
  Field,
  Icon,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
  colors,
  useAidaTheme,
} from "../../components/aida";
import { GlassScanner, type CapturedCard } from "../../components/GlassScanner";
import { SyncConfirmationSheet } from "../../components/SyncConfirmationSheet";

type DeviceSourceId = (typeof DEVICE_SYNC_SOURCES)[number]["id"];
type HealthSourceId = DeviceSourceId | "manual";
type ApiState = "idle" | "loading" | "success" | "error";

const CHIP_LABEL: Record<DeviceSourceId, string> = {
  apple: "Apple Health",
  garmin: "Garmin",
  oura: "Oura",
  whoop: "Whoop",
};

const ALL_HEALTH_SOURCE_IDS: HealthSourceId[] = [...DEVICE_SYNC_SOURCES.map((s) => s.id), "manual"];

export default function UploadScreen() {
  const router = useRouter();
  const { theme, userId, t } = useAidaTheme();

  // Insurance card state
  const [frontCard, setFrontCard] = useState<CapturedCard | null>(null);
  const [backCard, setBackCard] = useState<CapturedCard | null>(null);

  // Detected insurance details (from OCR or demo)
  const [detectedInsurance, setDetectedInsurance] = useState({
    carrier: demoData.insurance.carrier,
    plan: demoData.insurance.plan,
    memberId: demoData.insurance.memberId,
    groupNumber: demoData.insurance.groupNumber,
  });
  const updateDetectedInsurance = (
    key: "carrier" | "plan" | "memberId" | "groupNumber",
    value: string,
  ) => {
    setDetectedInsurance((current) => ({ ...current, [key]: value }));
  };

  const [healthSource, setHealthSource] = useState("Apple Health sync");
  const [deviceSynced, setDeviceSynced] = useState(false);
  const [lastDeviceSyncStats, setLastDeviceSyncStats] = useState<HealthSyncRunStats | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<HealthSourceId>("apple");
  const [deviceSyncing, setDeviceSyncing] = useState(false);
  const [syncSheet, setSyncSheet] = useState<{
    open: boolean;
    source: string;
    stats: HealthSyncRunStats | null;
  }>({ open: false, source: "", stats: null });
  const [manualEntry, setManualEntry] = useState(false);
  const [intakeNotes, setIntakeNotes] = useState("");
  const [healthFilePickerBusy, setHealthFilePickerBusy] = useState(false);
  const [healthFiles, setHealthFiles] = useState<
    { name: string; type: "health-export" | "lab-report" | "other"; data: string }[]
  >([]);
  const [manualFields, setManualFields] = useState({
    restingHr: "",
    hrv: "",
    sleep: "",
    bloodPressure: "",
    symptoms: "",
  });

  useEffect(() => {
    loadSyncedHealth().then((saved) => {
      if (!saved) return;
      if (saved.lastSyncStats) {
        setLastDeviceSyncStats(saved.lastSyncStats);
      }
      if (saved.metrics.length) {
        setDeviceSynced(true);
        setHealthSource(saved.lastSourceLabel);
        if (
          saved.lastSourceId === "apple" ||
          saved.lastSourceId === "garmin" ||
          saved.lastSourceId === "oura" ||
          saved.lastSourceId === "whoop"
        ) {
          setSelectedSourceId(saved.lastSourceId as HealthSourceId);
        }
      }
    });
  }, []);

  // Upload state
  const [uploadState, setUploadState] = useState<ApiState>("idle");
  const [uploadMessage, setUploadMessage] = useState(t("generateSummary"));

  const insuranceComplete = Boolean(frontCard && backCard);
  const hasHealthFileUpload = healthFiles.length > 0;
  const healthComplete = deviceSynced || manualEntry || hasHealthFileUpload;
  const canGenerate = insuranceComplete;
  const isManualSource = selectedSourceId === "manual";

  // ── Upload handler ─────────────────────────────────────────
  const handleUpload = async () => {
    if (!canGenerate || uploadState === "loading") return;

    setUploadState("loading");
    setUploadMessage(t("uploading"));

    // Build the files array with base64 data
    const files: Array<{
      name: string;
      type: "insurance-front" | "insurance-back" | "health-export" | "lab-report" | "other";
      data: string;
    }> = [];

    if (frontCard?.base64) {
      files.push({
        name: "insurance-card-front.jpg",
        type: "insurance-front",
        data: `data:image/jpeg;base64,${frontCard.base64}`,
      });
    }
    if (backCard?.base64) {
      files.push({
        name: "insurance-card-back.jpg",
        type: "insurance-back",
        data: `data:image/jpeg;base64,${backCard.base64}`,
      });
    }
    for (const h of healthFiles) {
      files.push({ name: h.name, type: h.type, data: h.data });
    }

    const manualBlock = buildManualVitalsBlock(manualFields);
    const notesCombined = [intakeNotes.trim(), manualBlock].filter(Boolean).join("\n\n");

    try {
      const response = await uploadPatientIntake({
        patientId: userId,
        insuranceComplete,
        healthComplete,
        healthSource: formatHealthSourceLine(t, {
          deviceSynced,
          lastSyncLabel: healthSource,
          manualEntry,
          healthFileCount: healthFiles.length,
        }),
        notes: notesCombined,
        files: files.length > 0 ? files : undefined,
      });

      // Update detected insurance from the response
      if (response.insurance) {
        setDetectedInsurance((current) => ({
          carrier: response.insurance.carrier ?? current.carrier,
          plan: response.insurance.plan ?? current.plan,
          memberId: response.insurance.memberId ?? current.memberId,
          groupNumber: response.insurance.groupNumber ?? current.groupNumber,
        }));
      }

      setUploadState("success");
      setUploadMessage(
        `${response.files.length} files processed. ${response.insurance.carrier} ${response.insurance.plan} detected.`,
      );
      setTimeout(() => router.push("/(patient)/summary"), 650);
    } catch (error) {
      setUploadState("error");
      setUploadMessage(error instanceof Error ? error.message : t("error"));
    }
  };

  const reviewItems = useMemo(
    () => [
      {
        label: t("insurance"),
        value: insuranceComplete ? t("readyForEligibilityCheck") : t("needsFrontAndBack"),
        done: insuranceComplete,
      },
      {
        label: t("healthData"),
        value: healthComplete
          ? t("readyToSummarize")
          : t("healthDataOptionalForSummary"),
        done: healthComplete,
      },
      {
        label: t("notes"),
        value: t("optionalContextIncluded"),
        done: true,
      },
    ],
    [healthComplete, insuranceComplete, t],
  );

  const runDeviceSync = async () => {
    if (deviceSyncing || isManualSource) return;
    setDeviceSyncing(true);
    try {
      const src = DEVICE_SYNC_SOURCES.find((s) => s.id === selectedSourceId) ?? DEVICE_SYNC_SOURCES[0]!;
      const s = await saveSyncedFromSource(src.id, src.label);
      setHealthSource(s.lastSourceLabel);
      setDeviceSynced(true);
      setLastDeviceSyncStats(s.lastSyncStats ?? null);
      setSyncSheet({ open: true, source: s.lastSourceLabel, stats: s.lastSyncStats ?? null });
    } finally {
      setDeviceSyncing(false);
    }
  };

  const addHealthFiles = async () => {
    if (healthFilePickerBusy) return;
    setHealthFilePickerBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (result.canceled) return;
      const next: { name: string; type: "health-export" | "lab-report" | "other"; data: string }[] = [];
      for (const asset of result.assets) {
        const b64 = await readAsStringAsync(asset.uri, { encoding: EncodingType.Base64 });
        const mime = asset.mimeType ?? "application/octet-stream";
        const dataUrl = `data:${mime};base64,${b64}`;
        const type = classifyHealthFileType(mime, asset.name);
        next.push({ name: asset.name || "health-file", type, data: dataUrl });
      }
      if (next.length) {
        setHealthFiles((f) => [...f, ...next]);
      }
    } catch (e) {
      console.warn("Health file pick", e);
    } finally {
      setHealthFilePickerBusy(false);
    }
  };

  const saveManualVitals = () => {
    const has = Object.values(manualFields).some((v) => v.trim().length > 0);
    if (has) {
      setManualEntry(true);
    } else {
      setManualEntry(false);
    }
  };

  return (
    <>
    <Screen
      title={t("upload")}
      subtitle={t("uploadSubtitle")}
    >
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card style={{ backgroundColor: theme.surface }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View style={[styles.iconBadge, { backgroundColor: `${theme.accent}16` }]}>
              <Icon name="cloud-upload" size={26} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.kicker, { color: theme.muted }]}>{t("secureIntake")}</Text>
              <Text style={[styles.heroTitle, { color: theme.ink }]}>
                {t("uploadNowEditBeforeSending")}
              </Text>
            </View>
          </View>
          <View style={styles.progressRow}>
            <ProgressStep label={t("healthData")} active done={healthComplete} />
            <ProgressStep label={t("insurance")} active done={insuranceComplete} />
            <ProgressStep label={t("reviewStep")} active={insuranceComplete} done={canGenerate} />
          </View>
        </Card>

        <Card>
          <SectionHeader
            icon="heart-pulse"
            title={t("healthData")}
            detail={t("uploadHealthChipsHelp")}
            complete={healthComplete}
            incompletePill="optional"
          />
          <View style={styles.chipRow}>
            {ALL_HEALTH_SOURCE_IDS.map((id) => {
              const selected = selectedSourceId === id;
              const label =
                id === "manual" ? t("manualEntryShort") : CHIP_LABEL[id as DeviceSourceId];
              return (
                <Pressable
                  key={id}
                  onPress={() => setSelectedSourceId(id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected ? theme.accent : theme.line,
                      backgroundColor: selected ? `${theme.accent}14` : theme.card,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? theme.accent : theme.ink,
                      fontWeight: "800",
                      fontSize: 13,
                    }}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {!isManualSource && (
            <>
              <Text style={[styles.subsectionLabel, { color: theme.muted, marginTop: 4 }]}>
                {t("deviceSync")}
              </Text>
              <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 18, marginBottom: 10 }}>
                {t("deviceSyncShort")}
              </Text>
              <View style={{ marginTop: 4 }}>
                <PrimaryButton
                  onPress={runDeviceSync}
                  icon="sync"
                  label={t("syncNow")}
                  disabled={deviceSyncing}
                />
              </View>
              {deviceSyncing && (
                <ActivityIndicator color={theme.accent} style={{ alignSelf: "center", marginTop: 6 }} />
              )}
              {lastDeviceSyncStats && deviceSynced && (
                <View
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: theme.card,
                    borderWidth: 1,
                    borderColor: theme.line,
                    gap: 4,
                  }}
                >
                  <Text style={{ color: theme.ink, fontSize: 13, fontWeight: "900" }}>{t("lastSyncIngest")}</Text>
                  <Text style={{ color: theme.ink, fontSize: 13, lineHeight: 19 }}>
                    {t("syncStatsSleepEvents", { n: lastDeviceSyncStats.sleepEvents })}
                  </Text>
                  <Text style={{ color: theme.ink, fontSize: 13, lineHeight: 19 }}>
                    {t("syncStatsTotalEvents", { n: lastDeviceSyncStats.totalEvents.toLocaleString() })}
                  </Text>
                  <Text style={{ color: theme.ink, fontSize: 13, lineHeight: 19 }}>
                    {t("syncStatsDataIngested", { size: formatIngestedBytes(lastDeviceSyncStats.bytesIn) })}
                  </Text>
                </View>
              )}
            </>
          )}

          {isManualSource && (
            <View style={{ marginTop: 4, gap: 12 }}>
              <Text style={{ color: theme.muted, fontSize: 13, lineHeight: 18 }}>
                {t("csvPdfXml")}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label={t("restingHr")}
                    value={manualFields.restingHr}
                    onChangeText={(restingHr) => setManualFields((m) => ({ ...m, restingHr }))}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label={t("hrv")}
                    value={manualFields.hrv}
                    onChangeText={(hrv) => setManualFields((m) => ({ ...m, hrv }))}
                  />
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label={t("sleep")}
                    value={manualFields.sleep}
                    onChangeText={(sleep) => setManualFields((m) => ({ ...m, sleep }))}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label={t("bloodPressure")}
                    value={manualFields.bloodPressure}
                    onChangeText={(bloodPressure) => setManualFields((m) => ({ ...m, bloodPressure }))}
                  />
                </View>
              </View>
              <Field
                label={t("symptomsMeasurements")}
                multiline
                value={manualFields.symptoms}
                onChangeText={(symptoms) => setManualFields((m) => ({ ...m, symptoms }))}
              />
              <SecondaryButton
                icon={manualEntry ? "check" : "content-save"}
                label={manualEntry ? t("manualDataSaved") : t("saveManualData")}
                onPress={saveManualVitals}
              />
              <SecondaryButton
                icon="file-plus-outline"
                label={healthFilePickerBusy ? t("uploading") : t("addHealthFile")}
                onPress={addHealthFiles}
                disabled={healthFilePickerBusy}
              />
              {healthFiles.length > 0 && (
                <View style={{ gap: 6 }}>
                  {healthFiles.map((f, i) => (
                    <View
                      key={`${f.name}-${i}`}
                      style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                    >
                      <Icon name="paperclip" size={18} color={theme.muted} />
                      <Text style={{ color: theme.ink, flex: 1, fontSize: 13, fontWeight: "700" }} numberOfLines={1}>
                        {f.name}
                      </Text>
                      <Pressable
                        onPress={() => setHealthFiles((list) => list.filter((_, j) => j !== i))}
                        hitSlop={8}
                      >
                        <Icon name="close-circle" size={20} color={theme.faint} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </Card>

        <Card>
          <SectionHeader
            icon="card-account-details"
            title={t("insuranceCard")}
            detail={t("insuranceCardDetail")}
            complete={insuranceComplete}
          />
          <View style={{ gap: 10 }}>
            <GlassScanner
              label={t("frontOfCard")}
              detail={t("frontOfCardDetail")}
              value={frontCard}
              onChange={setFrontCard}
            />
            <GlassScanner
              label={t("backOfCard")}
              detail={t("backOfCardDetail")}
              value={backCard}
              onChange={setBackCard}
            />
          </View>

          <View style={[styles.parsedPanel, { borderColor: theme.line, backgroundColor: theme.surface }]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: theme.ink }]}>{t("detectedDetails")}</Text>
              <Pill label={insuranceComplete ? t("verifiedFormat") : t("draft")} icon="text-recognition" />
            </View>
            <View style={{ gap: 10, marginTop: 12 }}>
              <Field
                label={t("carrier")}
                value={detectedInsurance.carrier}
                onChangeText={(value) => updateDetectedInsurance("carrier", value)}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <Field
                label={t("plan")}
                value={detectedInsurance.plan}
                onChangeText={(value) => updateDetectedInsurance("plan", value)}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <Field
                label={t("memberId")}
                value={detectedInsurance.memberId}
                onChangeText={(value) => updateDetectedInsurance("memberId", value)}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Field
                label={t("groupNumber")}
                value={detectedInsurance.groupNumber}
                onChangeText={(value) => updateDetectedInsurance("groupNumber", value)}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          </View>
        </Card>

        <Card>
          <SectionHeader
            icon="note-text-outline"
            title={t("optionalNotes")}
            detail={t("optionalNotesDetail")}
          />
          <Field
            label={t("notesForAida")}
            multiline
            value={intakeNotes}
            onChangeText={setIntakeNotes}
          />
        </Card>

        <Card style={{ backgroundColor: theme.surface }}>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Icon name="shield-check" size={24} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.ink, fontWeight: "900", fontSize: 16 }}>
                  {t("reviewBeforeSending")}
                </Text>
                <Text style={{ color: theme.muted, lineHeight: 20, marginTop: 4 }}>
                  {t("rawFilesPrivate")}
                </Text>
              </View>
            </View>
            <View style={{ gap: 9 }}>
              {reviewItems.map((item) => (
                <ReviewRow key={item.label} {...item} />
              ))}
            </View>
          </View>
        </Card>

        <StatusCard state={uploadState} message={uploadMessage} />

        <View style={{ gap: 10 }}>
          <PrimaryButton
            onPress={handleUpload}
            icon="creation"
            label={
              uploadState === "loading"
                ? t("uploading")
                : canGenerate
                  ? t("generateSummary")
                  : t("completeRequiredUploads")
            }
            disabled={!canGenerate || uploadState === "loading"}
          />
          <SecondaryButton href="/(patient)/home" icon="home" label={t("returnHome")} />
        </View>
      </View>
    </Screen>
    <SyncConfirmationSheet
      visible={syncSheet.open}
      onClose={() => setSyncSheet((s) => ({ ...s, open: false }))}
      sourceLabel={syncSheet.source}
      syncStats={syncSheet.stats}
    />
    </>
  );
}



// ─────────────────────────────────────────────────────────────
// Reusable sub-components (unchanged logic, lightly cleaned)
// ─────────────────────────────────────────────────────────────

function StatusCard({ state, message }: { state: ApiState; message: string }) {
  const { theme } = useAidaTheme();
  const tone =
    state === "success" ? colors.green : state === "error" ? colors.red : theme.accent;
  const icon: "check-circle" | "alert-circle-outline" | "cloud-sync" =
    state === "success" ? "check-circle" : state === "error" ? "alert-circle-outline" : "cloud-sync";

  return (
    <Card style={{ backgroundColor: `${tone}10`, borderColor: `${tone}44` }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        {state === "loading" ? (
          <ActivityIndicator color={tone} />
        ) : (
          <Icon name={icon} size={22} color={tone} />
        )}
        <Text style={{ color: theme.ink, flex: 1, fontWeight: "800", lineHeight: 20 }}>
          {message}
        </Text>
      </View>
    </Card>
  );
}

function SectionHeader({
  icon,
  title,
  detail,
  complete,
  incompletePill = "required",
}: {
  icon: "card-account-details" | "heart-pulse" | "note-text-outline";
  title: string;
  detail?: string;
  complete?: boolean;
  incompletePill?: "optional" | "required";
}) {
  const { theme, t } = useAidaTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
      <View style={[styles.smallIconBadge, { backgroundColor: `${theme.accent}14` }]}>
        <Icon name={icon} size={20} color={theme.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>{title}</Text>
          {complete !== undefined && (
            <Pill
              label={complete ? t("complete") : incompletePill === "optional" ? t("optional") : t("required")}
              icon={complete ? "check" : incompletePill === "optional" ? "circle-outline" : "alert-circle-outline"}
              tone={complete ? colors.green : incompletePill === "optional" ? theme.faint : colors.amber}
            />
          )}
        </View>
        {detail ? (
          <Text style={{ color: theme.muted, lineHeight: 20, marginTop: 3 }}>{detail}</Text>
        ) : null}
      </View>
    </View>
  );
}

function ProgressStep({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  const { theme } = useAidaTheme();
  return (
    <View style={{ flex: 1, gap: 7 }}>
      <View
        style={[
          styles.progressBar,
          { backgroundColor: done ? theme.accent : active ? `${theme.accent}35` : theme.line },
        ]}
      />
      <Text style={{ color: active ? theme.ink : theme.faint, fontSize: 11, fontWeight: "800" }}>
        {label}
      </Text>
    </View>
  );
}

function ReviewRow({
  label,
  value,
  done,
}: {
  label: string;
  value: string;
  done: boolean;
}) {
  const { theme } = useAidaTheme();
  return (
    <View style={styles.reviewRow}>
      <Icon name={done ? "check-circle" : "circle-outline"} size={19} color={done ? colors.green : theme.faint} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.ink, fontWeight: "900" }}>{label}</Text>
        <Text style={{ color: theme.muted, marginTop: 2, lineHeight: 18 }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = {
  heroTitle: {
    fontSize: 20,
    fontWeight: "900" as const,
    lineHeight: 25,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "900" as const,
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: "uppercase" as const,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900" as const,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  smallIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  rowBetween: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 10,
  },
  progressRow: {
    flexDirection: "row" as const,
    gap: 8,
    marginTop: 18,
  },
  progressBar: {
    height: 6,
    borderRadius: 999,
  },
  parsedPanel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
  },
  chipRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reviewRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 9,
  },
  subsectionLabel: {
    fontSize: 12,
    fontWeight: "900" as const,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
    marginTop: 4,
    marginBottom: 2,
  },
};

function formatHealthSourceLine(
  t: (key: I18nKey, vars?: Record<string, string | number>) => string,
  args: { deviceSynced: boolean; lastSyncLabel: string; manualEntry: boolean; healthFileCount: number },
): string {
  const parts: string[] = [];
  if (args.deviceSynced) parts.push(args.lastSyncLabel);
  if (args.manualEntry) parts.push(t("manualVitalsLabel"));
  if (args.healthFileCount > 0) {
    parts.push(t("manualHealthFileCount", { count: args.healthFileCount }));
  }
  return parts.length ? parts.join(" · ") : t("noHealthDataProvided");
}

function buildManualVitalsBlock(fields: {
  restingHr: string;
  hrv: string;
  sleep: string;
  bloodPressure: string;
  symptoms: string;
}): string {
  const lines: string[] = [];
  if (fields.restingHr.trim()) lines.push(`Resting heart rate: ${fields.restingHr.trim()}`);
  if (fields.hrv.trim()) lines.push(`HRV: ${fields.hrv.trim()}`);
  if (fields.sleep.trim()) lines.push(`Sleep: ${fields.sleep.trim()}`);
  if (fields.bloodPressure.trim()) lines.push(`Blood pressure: ${fields.bloodPressure.trim()}`);
  if (fields.symptoms.trim()) lines.push(`Symptoms / notes: ${fields.symptoms.trim()}`);
  if (lines.length === 0) return "";
  return `Manual vitals (patient-entered)\n${lines.join("\n")}`;
}

function classifyHealthFileType(mime: string, name: string): "health-export" | "lab-report" | "other" {
  const m = `${mime} ${name}`.toLowerCase();
  if (m.includes("pdf") || m.includes("csv") || m.includes("xml") || m.includes("text/")) {
    return "health-export";
  }
  if (m.startsWith("image/") || m.includes("png") || m.includes("jpg") || m.includes("heic")) {
    return "lab-report";
  }
  return "other";
}
