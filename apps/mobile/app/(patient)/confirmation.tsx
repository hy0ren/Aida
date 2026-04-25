import { Text, View } from "react-native";
import {
  Card,
  Icon,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
  colors,
} from "../../components/aida";

export default function ConfirmationScreen() {
  return (
    <Screen title="You're booked" subtitle="A confirmation was sent to your phone.">
      <View style={{ gap: 16, paddingBottom: 86 }}>
        <View style={{ alignItems: "center", paddingVertical: 14 }}>
          <View
            style={{
              width: 104,
              height: 104,
              borderRadius: 52,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#e8f7f0",
            }}
          >
            <Icon name="check" size={56} color={colors.green} />
          </View>
        </View>

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                backgroundColor: "#e8f7f3",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="doctor" size={28} color={colors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900" }}>
                Dr. Lin Chen
              </Text>
              <Text style={{ color: colors.muted, marginTop: 3 }}>
                General Practitioner
              </Text>
            </View>
            <Pill label="Scheduled" icon="check" />
          </View>

          <View style={{ gap: 12, marginTop: 18 }}>
            <Detail icon="calendar" text="Wed, May 6 at 2:30 PM" />
            <Detail icon="hospital-building" text="Bayview Family Medicine" />
            <Detail icon="map-marker" text="1840 Mission St, San Francisco" />
            <Detail icon="bag-personal" text="Bring insurance card and photo ID" />
          </View>
        </Card>

        <Card style={{ backgroundColor: "#f5f7f6" }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "900" }}>
            SMS RECEIPT
          </Text>
          <View
            style={{
              marginTop: 10,
              backgroundColor: "#fff",
              borderRadius: 18,
              padding: 14,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: colors.ink, lineHeight: 21 }}>
              Aida: Cita confirmada con Dr. Lin Chen el miercoles 6 de mayo a
              las 2:30 PM. Responde CANCELAR para anular.
            </Text>
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          <PrimaryButton href="/(patient)/home" icon="calendar-plus" label="Add to calendar" />
          <SecondaryButton href="/(patient)/home" icon="home" label="Done" />
        </View>
      </View>
    </Screen>
  );
}

function Detail({ icon, text }: { icon: "calendar" | "hospital-building" | "map-marker" | "bag-personal"; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Icon name={icon} size={18} color={colors.muted} />
      <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "700", flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}
