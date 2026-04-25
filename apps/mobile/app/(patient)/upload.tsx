import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
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
type UploadStatus = "empty" | "selected" | "processing" | "complete";

const healthSources: HealthSource[] = ["Apple Health", "Garmin", "Oura", "Whoop", "CSV/PDF"];

const nextStatus: Record<UploadStatus, UploadStatus> = {
  empty: "selected",
  selected: "processing",
  processing: "complete",
  complete: "empty",
};

export default function UploadScreen() {
  const { theme } = useAidaTheme();
  const [frontStatus, setFrontStatus] = useState<UploadStatus>("complete");
  const [backStatus, setBackStatus] = useState<UploadStatus>("empty");
  const [wearableStatus, setWearableStatus] = useState<UploadStatus>("selected");
  const [labStatus, setLabStatus] = useState<UploadStatus>("empty");
  const [healthMode, setHealthMode] = useState<HealthMode>("file");
  const [healthSource, setHealthSource] = useState<HealthSource>("Apple Health");
  const [manualEntry, setManualEntry] = useState(false);

  const insuranceComplete = frontStatus === "complete" && backStatus === "complete";
  const healthFileComplete = wearableStatus === "complete" || labStatus === "complete";
  const healthComplete = healthFileComplete || manualEntry;
  const canGenerate = insuranceComplete && healthComplete;

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
        label: "Patient notes",
        value: "Optional context saved",
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
            detail="Add clear photos of both sides. Tap each row to move through mock upload states."
            complete={insuranceComplete}
          />

          <View style={styles.actionGrid}>
            <ActionButton
              icon="camera"
              label="Take photo"
              onPress={() => setBackStatus((status) => nextStatus[status])}
            />
            <ActionButton
              icon="image-plus"
              label="Upload image"
              onPress={() => setFrontStatus((status) => nextStatus[status])}
            />
          </View>

          <View style={{ gap: 10, marginTop: 14 }}>
            <UploadRow
              label="Front of card"
              detail="Name, plan, member ID"
              fileName="insurance_front.jpg"
              status={frontStatus}
              onPress={() => setFrontStatus((status) => nextStatus[status])}
            />
            <UploadRow
              label="Back of card"
              detail="Claims phone and payer details"
              fileName="insurance_back.jpg"
              status={backStatus}
              onPress={() => setBackStatus((status) => nextStatus[status])}
            />
          </View>

          <InlineDivider />

          <View>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: theme.ink }]}>Extracted fields</Text>
              <Pill
                label={insuranceComplete ? "Ready" : "Mock OCR"}
                icon="text-recognition"
                tone={insuranceComplete ? colors.green : theme.accent}
              />
            </View>
            <View style={{ gap: 10, marginTop: 12 }}>
              <Field label="Provider" value="Aetna" />
              <Field label="Plan" value="Choice POS II" />
              <Field label="Member ID" value="XGH 482-19-7720" />
              <Field label="Group number" value="884216" />
            </View>
          </View>
        </Card>

        <Card>
          <SectionHeader
            icon="heart-pulse"
            title="Health data"
            detail="Upload wearable exports, lab files, or enter vitals manually."
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

              <UploadRow
                label="Wearable file"
                detail={`${healthSource} export, zipped XML, or CSV`}
                fileName="apple_health_export.zip"
                status={wearableStatus}
                onPress={() => setWearableStatus((status) => nextStatus[status])}
              />
              <UploadRow
                label="Lab PDF or CSV"
                detail="Blood work, metabolic panel, or recent vitals"
                fileName="sleep_hrv_report.pdf"
                status={labStatus}
                onPress={() => setLabStatus((status) => nextStatus[status])}
              />
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Resting HR" value="78 bpm" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="HRV" value="42 ms" />
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Sleep" value="5h 45m" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Blood pressure" value="128/82" />
                </View>
              </View>
              <Field
                label="Symptoms or measurements"
                multiline
                value="Fatigue, dizziness when standing, and higher than usual resting heart rate."
              />
              <SecondaryButton
                icon={manualEntry ? "check" : "content-save"}
                label={manualEntry ? "Manual vitals saved" : "Save manual vitals"}
                onPress={() => setManualEntry((value) => !value)}
              />
            </View>
          )}
        </Card>

        <Card>
          <SectionHeader
            icon="note-text-outline"
            title="Optional notes"
            detail="Add context for the summary, provider search, or booking call."
          />
          <Field
            label="Notes for Aida"
            multiline
            value="I have felt tired for three days and noticed my heart rate staying higher than usual. Prefer Spanish-speaking clinic staff if available."
          />
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

        <View style={{ gap: 10 }}>
          <PrimaryButton
            href="/(patient)/summary"
            icon="creation"
            label={canGenerate ? "Generate biometric summary" : "Complete required uploads"}
            disabled={!canGenerate}
          />
          <SecondaryButton href="/(patient)/home" icon="home" label="Return home" />
        </View>
      </View>
    </Screen>
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

function UploadRow({
  label,
  detail,
  fileName,
  status,
  onPress,
}: {
  label: string;
  detail: string;
  fileName: string;
  status: UploadStatus;
  onPress: () => void;
}) {
  const { theme } = useAidaTheme();
  const meta = getStatusMeta(status);
  const active = status !== "empty";
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.uploadRow,
        {
          borderColor: status === "complete" ? theme.accent : theme.line,
          backgroundColor: active ? `${theme.accent}0F` : theme.surface,
        },
      ]}
    >
      <View
        style={[
          styles.uploadIcon,
          { backgroundColor: status === "complete" ? theme.accent : theme.card },
        ]}
      >
        <Icon name={meta.icon} size={21} color={status === "complete" ? "#fff" : theme.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <Text style={{ color: theme.ink, fontSize: 15, fontWeight: "900" }}>{label}</Text>
          <StatusPill status={status} />
        </View>
        <Text style={{ color: theme.muted, lineHeight: 19, marginTop: 3 }}>
          {active ? fileName : detail}
        </Text>
      </View>
    </Pressable>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: "camera" | "image-plus";
  label: string;
  onPress: () => void;
}) {
  const { theme } = useAidaTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionButton, { borderColor: theme.line, backgroundColor: theme.surface }]}
    >
      <Icon name={icon} size={18} color={theme.accent} />
      <Text style={{ color: theme.accent, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function StatusPill({ status }: { status: UploadStatus }) {
  const meta = getStatusMeta(status);
  return <Pill label={meta.label} icon={meta.icon} tone={meta.tone} />;
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

function InlineDivider() {
  const { theme } = useAidaTheme();
  return <View style={{ height: 1, backgroundColor: theme.line, marginVertical: 16 }} />;
}

function getStatusMeta(status: UploadStatus) {
  switch (status) {
    case "selected":
      return { label: "Selected", icon: "file-check-outline" as const, tone: colors.amber };
    case "processing":
      return { label: "Processing", icon: "progress-clock" as const, tone: colors.plum };
    case "complete":
      return { label: "Complete", icon: "check" as const, tone: colors.green };
    default:
      return { label: "Empty", icon: "cloud-upload-outline" as const, tone: colors.faint };
  }
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
  actionGrid: {
    flexDirection: "row" as const,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 8,
  },
  uploadRow: {
    borderWidth: 1,
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
  reviewRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 9,
  },
};
