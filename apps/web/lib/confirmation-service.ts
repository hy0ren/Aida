import { ObjectId } from "mongodb";
import { demoData, type ConfirmationMessageResponse } from "@aida/shared";
import { demoConfirmationResponse } from "@/app/api/_mock/aida-demo";
import { collections, getDb, isMongoConfigured } from "@/lib/mongodb";

export type ConfirmationRequestBody = {
  appointmentId?: string;
  patientId?: string;
  expoPushToken?: string;
  language?: string;
  title?: string;
  message?: string;
};

function buildSpanishDemoMessage(): Pick<ConfirmationMessageResponse, "title" | "message"> {
  return {
    title: demoData.confirmationReceipt.title,
    message: demoData.confirmationReceipt.body,
  };
}

async function sendExpoPush({
  expoPushToken,
  title,
  message,
  appointmentId,
}: {
  expoPushToken: string;
  title: string;
  message: string;
  appointmentId: string;
}): Promise<{ status: "sent" | "failed"; expoTicketId?: string }> {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: expoPushToken,
      title,
      body: message,
      sound: "default",
      channelId: "appointment-confirmations",
      data: {
        type: "appointment-confirmation",
        appointmentId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Expo push request failed: ${response.status}`);
  }

  const payload = await response.json().catch(() => null) as {
    data?: { status?: string; id?: string; message?: string };
  } | null;

  if (payload?.data?.status === "error") {
    throw new Error(payload.data.message ?? "Expo push was rejected");
  }

  return {
    status: "sent",
    expoTicketId: payload?.data?.id,
  };
}

export async function sendAppointmentConfirmation(
  body: ConfirmationRequestBody,
): Promise<{ data: ConfirmationMessageResponse; source: "expo" | "database" | "demo" }> {
  const appointmentId = body.appointmentId ?? demoConfirmationResponse.appointmentId;
  const patientId = body.patientId ?? demoConfirmationResponse.patientId;
  const confirmationId = `confirm-${new ObjectId().toString()}`;
  const content = buildSpanishDemoMessage();
  const title = body.title ?? content.title;
  const message = body.message ?? content.message;
  const language = body.language ?? demoData.patient.preferredLanguage.label;
  const hasExpoToken = Boolean(body.expoPushToken?.trim());

  let status: ConfirmationMessageResponse["status"] = hasExpoToken ? "queued" : "logged";
  let expoTicketId: string | undefined;

  if (hasExpoToken) {
    try {
      const push = await sendExpoPush({
        expoPushToken: body.expoPushToken!.trim(),
        title,
        message,
        appointmentId,
      });
      status = push.status;
      expoTicketId = push.expoTicketId;
    } catch (error) {
      console.error("Expo confirmation push failed:", error);
      status = "failed";
    }
  }

  const data: ConfirmationMessageResponse = {
    confirmationId,
    patientId,
    appointmentId,
    channel: hasExpoToken ? "expo-push" : "in-app",
    to: hasExpoToken
      ? `Expo token ending ${body.expoPushToken!.slice(-6)}`
      : demoConfirmationResponse.to,
    language,
    status,
    title,
    message,
    expoTicketId,
  };

  if (isMongoConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection(collections.confirmationMessages).insertOne({
        _id: new ObjectId(),
        ...data,
        expoPushToken: body.expoPushToken,
        createdAt: new Date(),
      });
      await db.collection(collections.appointments).updateOne(
        { appointmentId },
        {
          $set: {
            confirmationSent: status === "sent" || status === "logged",
            confirmationChannel: data.channel,
            updatedAt: new Date(),
          },
        },
      );
      return { data, source: hasExpoToken ? "expo" : "database" };
    }
  }

  return {
    data: {
      ...demoConfirmationResponse,
      ...data,
    },
    source: hasExpoToken ? "expo" : "demo",
  };
}
