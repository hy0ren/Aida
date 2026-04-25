import { Text, View } from "react-native";
import { demoData } from "@aida/shared";
import {
  Card,
  Icon,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
  colors,
  useAidaTheme,
} from "../../components/aida";

export default function ConfirmationScreen() {
  const { theme } = useAidaTheme();
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
              backgroundColor: `${colors.green}18`,
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
                backgroundColor: `${theme.accent}18`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="doctor" size={28} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.ink, fontSize: 18, fontWeight: "900" }}>
                {demoData.providers[0].doctor}
              </Text>
              <Text style={{ color: theme.muted, marginTop: 3 }}>
                {demoData.providers[0].specialty}
              </Text>
            </View>
            <Pill label={demoData.selectedAppointment.status} icon="check" />
          </View>

          <View style={{ gap: 12, marginTop: 18 }}>
            <Detail icon="calendar" text={demoData.selectedAppointment.displayDateTime} />
            <Detail icon="hospital-building" text={demoData.providers[0].name} />
            <Detail icon="map-marker" text={demoData.providers[0].address} />
            <Detail icon="bag-personal" text="Bring insurance card and photo ID" />
          </View>
        </Card>

        <Card style={{ backgroundColor: theme.surface }}>
          <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "900" }}>
            SMS RECEIPT
          </Text>
          <View
            style={{
              marginTop: 10,
              backgroundColor: theme.card,
              borderRadius: 18,
              padding: 14,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: theme.ink, lineHeight: 21 }}>
              {demoData.smsReceipt.body}
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
  const { theme } = useAidaTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Icon name={icon} size={18} color={theme.muted} />
      <Text style={{ color: theme.ink, fontSize: 15, fontWeight: "700", flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}
