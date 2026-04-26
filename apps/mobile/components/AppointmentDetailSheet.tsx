import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppointmentResponse } from "@aida/shared";
import { cancelAppointment } from "../lib/api";
import { useAidaTheme, Icon, Pill, colors, SecondaryButton } from "./aida";

const backdropStyle = { backgroundColor: "rgba(0,0,0,0.45)" } as const;

type Props = {
  visible: boolean;
  onClose: () => void;
  appointment: AppointmentResponse | null;
  patientId: string;
  allowCancel: boolean;
  onCancelled?: () => void;
};

function formatAppointmentTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function AppointmentDetailSheet({
  visible,
  onClose,
  appointment,
  patientId,
  allowCancel,
  onCancelled,
}: Props) {
  const { theme, mode, t } = useAidaTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [cancelling, setCancelling] = useState(false);

  if (!visible || !appointment) {
    return null;
  }

  const canCancelRequest =
    allowCancel && (appointment.status === "pending" || appointment.status === "confirmed");

  const handleClose = () => {
    onClose();
    setCancelling(false);
  };

  const runCancel = async () => {
    setCancelling(true);
    try {
      await cancelAppointment({ appointmentId: appointment.appointmentId, patientId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onCancelled?.();
      handleClose();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      const msg = e instanceof Error ? e.message : t("couldNotCancelAppointment");
      Alert.alert(t("error"), msg);
    } finally {
      setCancelling(false);
    }
  };

  const confirmCancel = () => {
    Alert.alert(
      t("cancelThisAppointment"),
      t("confirmCancelAppointment"),
      [
        { text: t("keepAppointment"), style: "cancel" },
        { text: t("cancelThisAppointment"), style: "destructive", onPress: () => void runCancel() },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          onPress={handleClose}
          style={[{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }, backdropStyle]}
          accessibilityLabel={t("close")}
        />
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
            maxHeight: "88%",
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 10 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.faint,
                marginBottom: 12,
              }}
            />
            <Text
              style={{ color: theme.ink, fontSize: 18, fontWeight: "900" }}
            >
              {t("appointmentDetails")}
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: theme.ink, fontSize: 20, fontWeight: "900" }}>
              {appointment.clinicName}
            </Text>
            <Text style={{ color: theme.muted, lineHeight: 20 }}>{formatAppointmentTime(appointment.scheduledAt)}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
              <Pill label={appointment.status} icon="calendar-clock" />
              <Pill label={appointment.doctor} icon="doctor" tone={colors.plum} />
              <Pill label={appointment.specialty} icon="stethoscope" tone={colors.amber} />
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "800", marginBottom: 4 }}>
                {t("addressLabel")}
              </Text>
              <Text style={{ color: theme.ink, lineHeight: 20 }}>{appointment.address}</Text>
            </View>
            {appointment.preparation.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "800", marginBottom: 4 }}>
                  {t("preparationTitle")}
                </Text>
                {appointment.preparation.map((line, i) => (
                  <Text key={i} style={{ color: theme.ink, lineHeight: 20 }}>
                    • {line}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {cancelling ? (
            <View style={{ marginTop: 20, alignItems: "center", padding: 8 }}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : canCancelRequest ? (
            <Pressable
              onPress={confirmCancel}
              style={{
                marginTop: 18,
                minHeight: 50,
                borderRadius: 16,
                backgroundColor: `${colors.red}12`,
                borderWidth: 1,
                borderColor: `${colors.red}55`,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Icon name="calendar-remove" size={20} color={colors.red} />
              <Text style={{ color: colors.red, fontWeight: "900", fontSize: 16 }}>
                {t("cancelThisAppointment")}
              </Text>
            </Pressable>
          ) : null}

          <View style={{ marginTop: 14 }}>
            <SecondaryButton
              onPress={handleClose}
              icon="close"
              label={t("close")}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
