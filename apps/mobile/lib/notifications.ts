import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const ANDROID_CHANNEL_ID = "appointment-confirmations";

function getProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

export async function ensureNotificationPermissionsAsync(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Appointment confirmations",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#dc2626",
      sound: "default",
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const granted = await ensureNotificationPermissionsAsync();
  if (!granted) return null;

  // Remote Expo push tokens require a physical device and a dev/production build.
  // Expo Go (SDK 53+) and simulators/emulators cannot receive remote pushes, so
  // we skip token acquisition there and rely on the local notification fallback.
  if (!Constants.isDevice) return null;

  try {
    const projectId = getProjectId();
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token.data;
  } catch (error) {
    console.warn("Unable to fetch Expo push token", error);
    return null;
  }
}

export async function showLocalConfirmationAsync(
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const granted = await ensureNotificationPermissionsAsync();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      data: data ?? {},
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: null,
  });
}
