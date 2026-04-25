import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aida</Text>
      <Text style={styles.subtitle}>Mobile</Text>
      <Link href="/(auth)/login" style={styles.button}>
        <Text style={styles.buttonText}>Go to login</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f4f8",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    marginTop: 8,
  },
  button: {
    marginTop: 32,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
});
