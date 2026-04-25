import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Icon, colors, useAidaTheme } from "./aida";

export type CapturedCard = {
  uri: string;
  base64: string;
};

export interface GlassScannerProps {
  label: string;
  detail: string;
  value: CapturedCard | null;
  onChange: (card: CapturedCard | null) => void;
}

export function GlassScanner({ label, detail, value, onChange }: GlassScannerProps) {
  const { theme, mode } = useAidaTheme();
  const [stage, setStage] = useState<"empty" | "capturing" | "processing" | "uploaded">("empty");
  const scanAnim = useRef(new Animated.Value(0)).current;

  // React to value updates from props (e.g. if cleared from outside)
  useEffect(() => {
    if (!value && stage === "uploaded") {
      setStage("empty");
    } else if (value && stage === "empty") {
      setStage("uploaded");
    }
  }, [value, stage]);

  useEffect(() => {
    if (stage === "processing") {
      scanAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.stopAnimation();
    }
  }, [stage, scanAnim]);

  const requestPermissions = useCallback(async () => {
    const camera = await ImagePicker.requestCameraPermissionsAsync();
    const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (camera.status !== "granted" || media.status !== "granted") {
      Alert.alert(
        "Permissions required",
        "Aida needs camera and photo library access to photograph your records.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  }, []);

  const captureImage = useCallback(async (source: "camera" | "library") => {
    const ok = await requestPermissions();
    if (!ok) return;

    setStage("capturing");

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 10], // standard card aspect ratio
      quality: 0.85,
      base64: true,
    };

    let result: ImagePicker.ImagePickerResult;
    try {
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }
    } catch (err) {
      setStage("empty");
      const message = err instanceof Error ? err.message : String(err);
      const noCamera = /not available|simulator/i.test(message);
      Alert.alert(
        noCamera ? "Camera unavailable" : "Could not open photo",
        noCamera
          ? "The camera is not available here (e.g. iOS Simulator). Use a real device, or pick from your library."
          : message,
        noCamera
          ? [
              { text: "Choose from library", onPress: () => void captureImage("library") },
              { text: "OK", style: "cancel" },
            ]
          : [{ text: "OK" }]
      );
      return;
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

    // Simulate OCR scanning time for UX
    setTimeout(() => {
      onChange({ uri: asset.uri, base64: base64Data });
      setStage("uploaded");
    }, 1500);
  }, [requestPermissions, onChange]);

  const showCaptureOptions = useCallback(() => {
    if (stage === "uploaded") {
      onChange(null);
      return;
    }
    Alert.alert(label, "Take a clear photo or select from your library.", [
      { text: "Take photo", onPress: () => captureImage("camera") },
      { text: "Choose from library", onPress: () => captureImage("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [label, stage, captureImage, onChange]);

  const isProcessing = stage === "processing";
  const isUploaded = stage === "uploaded";
  const isCapturing = stage === "capturing";

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60], // Based on height
  });

  return (
    <Pressable
      onPress={showCaptureOptions}
      style={[
        styles.container,
        {
          borderColor: isUploaded ? theme.accent : isProcessing ? colors.amber : theme.line,
          backgroundColor: isUploaded
            ? `${theme.accent}12`
            : isProcessing
            ? `${colors.amber}12`
            : theme.surface,
        },
      ]}
    >
      {/* Background active glass gradient during processing */}
      {isProcessing && (
        <LinearGradient
          colors={[`${colors.amber}05`, `${colors.amber}25`]}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Captured Image Preview */}
      {value?.uri && (isUploaded || isProcessing) && (
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: value.uri }} style={styles.thumbnail} resizeMode="cover" />
          
          {isProcessing && (
            <BlurView intensity={25} tint={mode} style={StyleSheet.absoluteFill}>
              <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
              <View style={styles.overlayCenter}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            </BlurView>
          )}

          {isUploaded && (
            <BlurView intensity={30} tint="dark" style={styles.successGlassPill}>
              <Icon name="check" size={14} color="#fff" />
            </BlurView>
          )}
        </View>
      )}

      {/* Placeholder Icon */}
      {!value?.uri && (
        <View style={[styles.iconBadge, { backgroundColor: isCapturing ? `${theme.accent}20` : theme.card }]}>
          {isCapturing ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Icon name="camera-plus" size={24} color={theme.accent} />
          )}
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.ink, fontSize: 16, fontWeight: "900" }}>{label}</Text>
        <Text style={{ color: theme.muted, lineHeight: 20, marginTop: 3 }}>
          {isProcessing
            ? "Reading text via ZETIC Melange…"
            : isUploaded
            ? "Captured — tap to replace"
            : isCapturing
            ? "Opening camera…"
            : detail}
        </Text>
      </View>

      {isProcessing && <ActivityIndicator size="small" color={colors.amber} />}
      {isUploaded && (
        <View style={[styles.glassPill, { backgroundColor: `${theme.accent}20` }]}>
          <Text style={{ color: theme.accent, fontWeight: "900", fontSize: 12 }}>Replace</Text>
        </View>
      )}
      {stage === "empty" && (
        <View style={[styles.glassPill, { backgroundColor: `${theme.accent}15` }]}>
          <Text style={{ color: theme.accent, fontWeight: "900", fontSize: 12 }}>Add</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    overflow: "hidden",
  },
  thumbnailContainer: {
    width: 68,
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  scanLine: {
    width: "100%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  successGlassPill: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  glassPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
});
