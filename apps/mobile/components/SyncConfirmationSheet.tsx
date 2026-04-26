import * as Haptics from "expo-haptics";
import { useEffect, useMemo } from "react";
import { Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { buildRandomSyncConfirmationNarrative } from "../lib/sync-confirmation-copy";
import { formatIngestedBytes, type HealthSyncRunStats } from "../lib/synced-health-data";
import { useAidaTheme, Icon, colors } from "./aida";

type Props = {
  visible: boolean;
  onClose: () => void;
  sourceLabel: string;
  /** Rich ingest stats (device sync only). Omitted e.g. from profile quick sync. */
  syncStats?: HealthSyncRunStats | null;
};

const backdropStyle = { backgroundColor: "rgba(0,0,0,0.45)" } as const;

export function SyncConfirmationSheet({ visible, onClose, sourceLabel, syncStats }: Props) {
  const { theme, mode, t } = useAidaTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const narrative = useMemo(
    () => (visible ? buildRandomSyncConfirmationNarrative() : null),
    [visible],
  );

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [visible]);

  if (!visible || !narrative) {
    return null;
  }

  const lineInk = theme.ink;
  const subtle = theme.muted;
  const boldSize = 22;
  const panBg = mode === "dark" ? theme.card : theme.wash;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          onPress={onClose}
          style={[{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }, backdropStyle]}
          accessibilityLabel="Dismiss"
        />
        {/*
         * Avoid Reanimated `entering` on views inside `Modal` — it can throw
         * "Uncaught error in host function" on some iOS / RN builds.
         */}
        <View
            style={{
              width,
              backgroundColor: mode === "dark" ? theme.surface : "#fff",
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              paddingTop: 12,
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: 20,
              borderWidth: 1,
              borderColor: theme.line,
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: -4 },
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 6 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.faint,
                  marginBottom: 12,
                }}
              />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon name="check-circle" size={26} color={colors.green} />
                <Text style={{ color: lineInk, fontSize: 18, fontWeight: "900" }}>{sourceLabel}</Text>
              </View>
              <Text style={{ color: subtle, fontSize: 13, textAlign: "center", lineHeight: 19 }}>
                {t("syncSheetKicker")}
              </Text>
            </View>

            {syncStats ? (
              <View
                style={{
                  marginTop: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  backgroundColor: panBg,
                  borderWidth: 1,
                  borderColor: theme.line,
                  gap: 6,
                }}
              >
                <Text style={{ color: lineInk, fontSize: 15, fontWeight: "800" }}>{t("syncStatsHeading")}</Text>
                <Text style={{ color: lineInk, fontSize: 14, lineHeight: 20 }}>
                  {t("syncStatsSleepEvents", { n: syncStats.sleepEvents })}
                </Text>
                <Text style={{ color: lineInk, fontSize: 14, lineHeight: 20 }}>
                  {t("syncStatsTotalEvents", { n: syncStats.totalEvents.toLocaleString() })}
                </Text>
                <Text style={{ color: lineInk, fontSize: 14, lineHeight: 20 }}>
                  {t("syncStatsDataIngested", { size: formatIngestedBytes(syncStats.bytesIn) })}
                </Text>
              </View>
            ) : null}

            <View
              style={{
                marginTop: 14,
                marginBottom: 4,
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: 16,
                backgroundColor: panBg,
              }}
            >
              <Text style={{ color: lineInk, fontSize: 16, lineHeight: 26, marginBottom: 6 }}>
                <Text style={{ fontSize: boldSize, fontWeight: "800", color: theme.accent }}>
                  {narrative.exerciseValue}
                </Text>{" "}
                {narrative.exerciseUnit}
              </Text>
              <Text style={{ color: lineInk, fontSize: 16, lineHeight: 26, marginBottom: 6 }}>
                <Text style={{ fontSize: boldSize, fontWeight: "800", color: theme.accent }}>
                  {narrative.sleepDescriptor}
                </Text>{" "}
                {t("syncLineSleep")}
              </Text>
              <Text style={{ color: lineInk, fontSize: 16, lineHeight: 26 }}>
                {t("syncLineSpanning")}{" "}
                <Text style={{ fontSize: boldSize, fontWeight: "800", color: theme.accent }}>
                  {narrative.daySpan}
                </Text>{" "}
                {narrative.dayLabel}
              </Text>
            </View>

            <Text
              style={{ color: subtle, fontSize: 12, lineHeight: 18, marginTop: 2, textAlign: "center" }}
              accessibilityLabel={narrative.fullSentence}
            >
              {narrative.fullSentence}
            </Text>

            <Pressable
              onPress={onClose}
              style={{
                marginTop: 16,
                minHeight: 50,
                borderRadius: 16,
                backgroundColor: theme.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>{t("done")}</Text>
            </Pressable>
        </View>
      </View>
    </Modal>
  );
}
