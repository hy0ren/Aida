import { useRouter } from "expo-router";
import { demoData } from "@aida/shared";
import { useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { uploadPatientIntake } from "../../lib/api";
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

type HealthMode = "file" | "manual";
type HealthSource = "Apple Health" | "Garmin" | "Oura" | "Whoop" | "CSV/PDF";
type ApiState = "idle" | "loading" | "success" | "error";

const healthSources: HealthSource[] = ["Apple Health", "Garmin", "Oura", "Whoop", "CSV/PDF"];
const intakeNotes = demoData.healthSummary.notesForAida;

export default function UploadScreen() {
  const router = useRouter();
  const { theme, mode, userId, t } = useAidaTheme();

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

  // Health data state
  const [healthMode, setHealthMode] = useState<HealthMode>("file");
  const [healthSource, setHealthSource] = useState<HealthSource>("Apple Health");
  const [healthUploaded, setHealthUploaded] = useState(true);
  const [manualEntry, setManualEntry] = useState(false);

  // Upload state
  const [uploadState, setUploadState] = useState<ApiState>("idle");
  const [uploadMessage, setUploadMessage] = useState(t("generateSummary"));

  const insuranceComplete = Boolean(frontCard && backCard);
  const healthComplete = healthUploaded || manualEntry;
  const canGenerate = insuranceComplete && healthComplete;

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

    try {
      const response = await uploadPatientIntake({
        patientId: userId,
        insuranceComplete,
        healthComplete,
        healthSource,
        notes: intakeNotes,
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
        value: healthComplete ? t("readyToSummarize") : t("uploadOrManual"),
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

  return (
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
            <ProgressStep label={t("insurance")} active done={insuranceComplete} />
            <ProgressStep label={t("healthData")} active={insuranceComplete} done={healthComplete} />
            <ProgressStep label={t("reviewStep")} active={canGenerate} done={canGenerate} />
          </View>
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
            icon="heart-pulse"
            title={t("healthData")}
            detail={t("healthDataDetail")}
            complete={healthComplete}
          />

          <View style={[styles.segmented, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <SegmentButton
              label={t("upload")}
              icon="file-upload"
              active={healthMode === "file"}
              onPress={() => setHealthMode("file")}
            />
            <SegmentButton
              label={t("manual")}
              icon="pencil"
              active={healthMode === "manual"}
              onPress={() => setHealthMode("manual")}
            />
          </View>

          {healthMode === "file" ? (
            <View style={{ gap: 14 }}>
              <View style={styles.sourceGrid}>
                {healthSources.map((source) => (
                  <Pressable
                    key={source}
                    onPress={() => setHealthSource(source)}
                    style={[
                      styles.sourceChip,
                      {
                        borderColor: healthSource === source ? theme.accent : theme.line,
                        backgroundColor:
                          healthSource === source ? `${theme.accent}12` : theme.card,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: healthSource === source ? theme.accent : theme.ink,
                        fontWeight: "800",
                      }}
                    >
                      {source}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <UploadDropzone
                label={`${healthSource} export`}
                detail={t("csvPdfXml")}
                status={healthUploaded ? "uploaded" : "ready"}
                onPress={() => setHealthUploaded((value) => !value)}
              />
              {healthUploaded && (
                <View style={styles.fileList}>
                  {demoData.healthSummary.uploadFiles.map((file) => (
                    <FileRow key={file.name} name={file.name} detail={file.detail} />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field label={t("restingHr")} value={demoData.healthSummary.manualMeasurements.restingHeartRate} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label={t("hrv")} value={demoData.healthSummary.manualMeasurements.hrv} />
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field label={t("sleep")} value={demoData.healthSummary.manualMeasurements.sleep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label={t("bloodPressure")} value={demoData.healthSummary.manualMeasurements.bloodPressure} />
                </View>
              </View>
              <Field
                label={t("symptomsMeasurements")}
                multiline
                value={demoData.healthSummary.manualMeasurements.symptoms}
              />
              <SecondaryButton
                icon={manualEntry ? "check" : "content-save"}
                label={manualEntry ? t("manualDataSaved") : t("saveManualData")}
                onPress={() => setManualEntry((value) => !value)}
              />
            </View>
          )}
        </Card>

        <Card>
          <SectionHeader
            icon="note-text-outline"
            title={t("optionalNotes")}
            detail={t("optionalNotesDetail")}
          />
          <Field label={t("notesForAida")} multiline value={intakeNotes} />
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
}: {
  icon: "card-account-details" | "heart-pulse" | "note-text-outline";
  title: string;
  detail: string;
  complete?: boolean;
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
              label={complete ? t("complete") : t("required")}
              icon={complete ? "check" : "alert-circle-outline"}
              tone={complete ? colors.green : colors.amber}
            />
          )}
        </View>
        <Text style={{ color: theme.muted, lineHeight: 20, marginTop: 3 }}>{detail}</Text>
      </View>
    </View>
  );
}

function UploadDropzone({
  label,
  detail,
  status,
  onPress,
}: {
  label: string;
  detail: string;
  status: "empty" | "ready" | "uploaded";
  onPress: () => void;
}) {
  const { theme, t } = useAidaTheme();
  const uploaded = status === "uploaded";
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.dropzone,
        {
          borderColor: uploaded ? theme.accent : theme.line,
          backgroundColor: uploaded ? `${theme.accent}10` : theme.surface,
        },
      ]}
    >
      <View style={[styles.uploadIcon, { backgroundColor: uploaded ? theme.accent : theme.card }]}>
        <Icon
          name={uploaded ? "check" : status === "ready" ? "camera-plus" : "cloud-upload-outline"}
          size={22}
          color={uploaded ? "#fff" : theme.accent}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.ink, fontSize: 15, fontWeight: "900" }}>{label}</Text>
        <Text style={{ color: theme.muted, lineHeight: 19, marginTop: 3 }}>
          {uploaded ? t("uploadedAndReady") : detail}
        </Text>
      </View>
      <Text style={{ color: theme.accent, fontWeight: "900" }}>
        {uploaded ? t("replace") : t("add")}
      </Text>
    </Pressable>
  );
}

function SegmentButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: "file-upload" | "pencil";
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useAidaTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segmentButton,
        { backgroundColor: active ? theme.card : "transparent" },
      ]}
    >
      <Icon name={icon} size={17} color={active ? theme.accent : theme.muted} />
      <Text style={{ color: active ? theme.accent : theme.muted, fontWeight: "900" }}>
        {label}
      </Text>
    </Pressable>
  );
}

function FileRow({ name, detail }: { name: string; detail: string }) {
  const { theme } = useAidaTheme();
  return (
    <View style={[styles.fileRow, { borderColor: theme.line }]}>
      <Icon name="file-document-outline" size={20} color={theme.accent} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.ink, fontWeight: "900" }}>{name}</Text>
        <Text style={{ color: theme.muted, marginTop: 2 }}>{detail}</Text>
      </View>
      <Icon name="dots-horizontal" size={22} color={theme.faint} />
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
  dropzone: {
    borderWidth: 1,
    borderStyle: "dashed" as const,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  parsedPanel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
  },
  segmented: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 4,
    flexDirection: "row" as const,
    marginBottom: 14,
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 7,
  },
  sourceGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  sourceChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  fileList: {
    gap: 8,
  },
  fileRow: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  reviewRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 9,
  },
};
