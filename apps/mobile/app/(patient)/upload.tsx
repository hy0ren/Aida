import { useRouter } from "expo-router";
import { demoData } from "@aida/shared";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
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

type HealthMode = "file" | "manual";
type HealthSource = "Apple Health" | "Garmin" | "Oura" | "Whoop" | "CSV/PDF";
type UploadStage = "empty" | "capturing" | "processing" | "uploaded";
type ApiState = "idle" | "loading" | "success" | "error";

interface CapturedCard {
  uri: string;
  base64: string;
  width: number;
  height: number;
}

const healthSources: HealthSource[] = ["Apple Health", "Garmin", "Oura", "Whoop", "CSV/PDF"];
const intakeNotes = demoData.healthSummary.notesForAida;

export default function UploadScreen() {
  const router = useRouter();
  const { theme, mode } = useAidaTheme();

  // Insurance card state
  const [frontStage, setFrontStage] = useState<UploadStage>("empty");
  const [backStage, setBackStage] = useState<UploadStage>("empty");
  const [frontCard, setFrontCard] = useState<CapturedCard | null>(null);
  const [backCard, setBackCard] = useState<CapturedCard | null>(null);

  // Detected insurance details (from OCR or demo)
  const [detectedInsurance, setDetectedInsurance] = useState({
    carrier: demoData.insurance.carrier,
    plan: demoData.insurance.plan,
    memberId: demoData.insurance.memberId,
    groupNumber: demoData.insurance.groupNumber,
  });

  // Health data state
  const [healthMode, setHealthMode] = useState<HealthMode>("file");
  const [healthSource, setHealthSource] = useState<HealthSource>("Apple Health");
  const [healthUploaded, setHealthUploaded] = useState(true);
  const [manualEntry, setManualEntry] = useState(false);

  // Upload state
  const [uploadState, setUploadState] = useState<ApiState>("idle");
  const [uploadMessage, setUploadMessage] = useState("Ready to generate a clinician-ready summary.");

  const insuranceComplete = frontStage === "uploaded" && backStage === "uploaded";
  const healthComplete = healthUploaded || manualEntry;
  const canGenerate = insuranceComplete && healthComplete;

  // ── Image capture helpers ──────────────────────────────────
  const requestPermissions = useCallback(async () => {
    const camera = await ImagePicker.requestCameraPermissionsAsync();
    const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (camera.status !== "granted" || media.status !== "granted") {
      Alert.alert(
        "Permissions required",
        "Aida needs camera and photo library access to photograph your insurance card.",
        [{ text: "OK" }],
      );
      return false;
    }
    return true;
  }, []);

  const captureImage = useCallback(
    async (
      source: "camera" | "library",
      side: "front" | "back",
    ) => {
      const ok = await requestPermissions();
      if (!ok) return;

      const setStage = side === "front" ? setFrontStage : setBackStage;
      const setCard = side === "front" ? setFrontCard : setBackCard;

      setStage("capturing");

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 10], // insurance card aspect
        quality: 0.85,
        base64: true,
      };

      let result: ImagePicker.ImagePickerResult;
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (result.canceled || !result.assets?.[0]) {
        setStage("empty");
        return;
      }

      const asset = result.assets[0];
      const base64Data = asset.base64 ?? "";

      if (!base64Data) {
        Alert.alert("Error", "Could not read the selected image.");
        setStage("empty");
        return;
      }

      setStage("processing");

      // Simulate brief OCR processing delay for UX continuity
      await new Promise((r) => setTimeout(r, 1200));

      setCard({
        uri: asset.uri,
        base64: base64Data,
        width: asset.width ?? 800,
        height: asset.height ?? 500,
      });
      setStage("uploaded");
    },
    [requestPermissions],
  );

  const showCaptureOptions = useCallback(
    (side: "front" | "back") => {
      Alert.alert(
        `${side === "front" ? "Front" : "Back"} of insurance card`,
        "Take a clear photo or select from your library.",
        [
          { text: "Take photo", onPress: () => captureImage("camera", side) },
          { text: "Choose from library", onPress: () => captureImage("library", side) },
          { text: "Cancel", style: "cancel" },
        ],
      );
    },
    [captureImage],
  );

  // ── Upload handler ─────────────────────────────────────────
  const handleUpload = async () => {
    if (!canGenerate || uploadState === "loading") return;

    setUploadState("loading");
    setUploadMessage("Uploading intake packet and processing securely…");

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
        insuranceComplete,
        healthComplete,
        healthSource,
        notes: intakeNotes,
        files: files.length > 0 ? files : undefined,
      });

      // Update detected insurance from the response
      if (response.insurance) {
        setDetectedInsurance({
          carrier: response.insurance.carrier ?? detectedInsurance.carrier,
          plan: response.insurance.plan ?? detectedInsurance.plan,
          memberId: response.insurance.memberId ?? detectedInsurance.memberId,
          groupNumber: response.insurance.groupNumber ?? detectedInsurance.groupNumber,
        });
      }

      setUploadState("success");
      setUploadMessage(
        `${response.files.length} files processed. ${response.insurance.carrier} ${response.insurance.plan} detected.`,
      );
      setTimeout(() => router.push("/(patient)/summary"), 650);
    } catch (error) {
      setUploadState("error");
      setUploadMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
    }
  };

  const reviewItems = useMemo(
    () => [
      {
        label: "Insurance",
        value: insuranceComplete ? "Ready for eligibility check" : "Needs front and back",
        done: insuranceComplete,
      },
      {
        label: "Health data",
        value: healthComplete ? "Ready to summarize" : "Upload data or enter manually",
        done: healthComplete,
      },
      {
        label: "Notes",
        value: "Optional context included",
        done: true,
      },
    ],
    [healthComplete, insuranceComplete],
  );

  return (
    <Screen
      title="Upload"
      subtitle="Add the records Aida needs to verify coverage and prepare a clinician-ready summary."
    >
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <Card style={{ backgroundColor: theme.surface }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View style={[styles.iconBadge, { backgroundColor: `${theme.accent}16` }]}>
              <Icon name="cloud-upload" size={26} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.kicker, { color: theme.muted }]}>Secure intake</Text>
              <Text style={[styles.heroTitle, { color: theme.ink }]}>
                Upload now, edit before sending.
              </Text>
            </View>
          </View>
          <View style={styles.progressRow}>
            <ProgressStep label="Insurance" active done={insuranceComplete} />
            <ProgressStep label="Health data" active={insuranceComplete} done={healthComplete} />
            <ProgressStep label="Review" active={canGenerate} done={canGenerate} />
          </View>
        </Card>

        <Card>
          <SectionHeader
            icon="card-account-details"
            title="Insurance card"
            detail="Take or upload clear photos of both sides."
            complete={insuranceComplete}
          />
          <View style={{ gap: 10 }}>
            <InsuranceDropzone
              label="Front of card"
              detail="Name, plan, member ID"
              stage={frontStage}
              imageUri={frontCard?.uri}
              onCapture={() => showCaptureOptions("front")}
              onRemove={() => {
                setFrontStage("empty");
                setFrontCard(null);
              }}
            />
            <InsuranceDropzone
              label="Back of card"
              detail="Claims phone and payer details"
              stage={backStage}
              imageUri={backCard?.uri}
              onCapture={() => showCaptureOptions("back")}
              onRemove={() => {
                setBackStage("empty");
                setBackCard(null);
              }}
            />
          </View>

          <View style={[styles.parsedPanel, { borderColor: theme.line, backgroundColor: theme.surface }]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: theme.ink }]}>Detected details</Text>
              <Pill label={insuranceComplete ? "Verified format" : "Draft"} icon="text-recognition" />
            </View>
            <View style={{ gap: 10, marginTop: 12 }}>
              <Field label="Carrier" value={detectedInsurance.carrier} />
              <Field label="Plan" value={detectedInsurance.plan} />
              <Field label="Member ID" value={detectedInsurance.memberId} />
              <Field label="Group number" value={detectedInsurance.groupNumber} />
            </View>
          </View>
        </Card>

        <Card>
          <SectionHeader
            icon="heart-pulse"
            title="Health data"
            detail="Use a wearable export, lab file, or manual entry."
            complete={healthComplete}
          />

          <View style={[styles.segmented, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <SegmentButton
              label="Upload"
              icon="file-upload"
              active={healthMode === "file"}
              onPress={() => setHealthMode("file")}
            />
            <SegmentButton
              label="Manual"
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
                detail="CSV, PDF, XML, or zipped export"
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
                  <Field label="Resting HR" value={demoData.healthSummary.manualMeasurements.restingHeartRate} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="HRV" value={demoData.healthSummary.manualMeasurements.hrv} />
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Sleep" value={demoData.healthSummary.manualMeasurements.sleep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Blood pressure" value={demoData.healthSummary.manualMeasurements.bloodPressure} />
                </View>
              </View>
              <Field
                label="Symptoms or measurements"
                multiline
                value={demoData.healthSummary.manualMeasurements.symptoms}
              />
              <SecondaryButton
                icon={manualEntry ? "check" : "content-save"}
                label={manualEntry ? "Manual data saved" : "Save manual data"}
                onPress={() => setManualEntry((value) => !value)}
              />
            </View>
          )}
        </Card>

        <Card>
          <SectionHeader
            icon="note-text-outline"
            title="Optional notes"
            detail="Add anything that should shape the summary or booking call."
          />
          <Field label="Notes for Aida" multiline value={intakeNotes} />
        </Card>

        <Card style={{ backgroundColor: theme.surface }}>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Icon name="shield-check" size={24} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.ink, fontWeight: "900", fontSize: 16 }}>
                  Review before Aida sends anything
                </Text>
                <Text style={{ color: theme.muted, lineHeight: 20, marginTop: 4 }}>
                  Raw files stay private until you approve the generated summary and appointment request.
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
                ? "Uploading…"
                : canGenerate
                  ? "Generate summary"
                  : "Complete required uploads"
            }
            disabled={!canGenerate || uploadState === "loading"}
          />
          <SecondaryButton href="/(patient)/home" icon="home" label="Return home" />
        </View>
      </View>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// Insurance card dropzone with real image preview
// ─────────────────────────────────────────────────────────────
function InsuranceDropzone({
  label,
  detail,
  stage,
  imageUri,
  onCapture,
  onRemove,
}: {
  label: string;
  detail: string;
  stage: UploadStage;
  imageUri?: string;
  onCapture: () => void;
  onRemove: () => void;
}) {
  const { theme, mode } = useAidaTheme();
  const isProcessing = stage === "processing";
  const isUploaded = stage === "uploaded";
  const isCapturing = stage === "capturing";

  return (
    <Pressable
      onPress={isUploaded ? onRemove : onCapture}
      style={[
        styles.dropzone,
        {
          borderColor: isUploaded ? theme.accent : isProcessing ? colors.amber : theme.line,
          backgroundColor: isUploaded
            ? `${theme.accent}10`
            : isProcessing
              ? `${colors.amber}08`
              : theme.surface,
          overflow: "hidden",
        },
      ]}
    >
      {/* Show captured image preview */}
      {imageUri && (isUploaded || isProcessing) && (
        <View style={{ width: 64, height: 40, borderRadius: 8, overflow: "hidden", marginRight: 4 }}>
          <Image
            source={{ uri: imageUri }}
            style={{ width: 64, height: 40 }}
            resizeMode="cover"
          />
          {isProcessing && (
            <View
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.3)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
          {isUploaded && (
            <View
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: theme.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="check" size={12} color="#fff" />
            </View>
          )}
        </View>
      )}

      {/* Icon when no image yet */}
      {!imageUri && (
        <View style={[styles.uploadIcon, { backgroundColor: isCapturing ? `${theme.accent}20` : theme.card }]}>
          {isCapturing ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Icon name="camera-plus" size={22} color={theme.accent} />
          )}
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.ink, fontSize: 15, fontWeight: "900" }}>{label}</Text>
        <Text style={{ color: theme.muted, lineHeight: 19, marginTop: 3 }}>
          {isProcessing
            ? "Reading card with OCR…"
            : isUploaded
              ? "Captured — tap to replace"
              : isCapturing
                ? "Opening camera…"
                : detail}
        </Text>
      </View>

      {isProcessing && <ActivityIndicator size="small" color={colors.amber} />}
      {isUploaded && (
        <Text style={{ color: theme.accent, fontWeight: "900" }}>Replace</Text>
      )}
      {stage === "empty" && (
        <Text style={{ color: theme.accent, fontWeight: "900" }}>Add</Text>
      )}
    </Pressable>
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
  const { theme } = useAidaTheme();
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
              label={complete ? "Complete" : "Required"}
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
  const { theme } = useAidaTheme();
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
          {uploaded ? "Uploaded and ready to review" : detail}
        </Text>
      </View>
      <Text style={{ color: theme.accent, fontWeight: "900" }}>
        {uploaded ? "Replace" : "Add"}
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
