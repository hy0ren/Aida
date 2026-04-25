import { View, Text, StyleSheet } from "react-native";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.hint}>Placeholder screen</Text>
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
  title: { fontSize: 22, fontWeight: "600", color: "#0f172a" },
  hint: { marginTop: 8, color: "#64748b", fontSize: 14 },
});
