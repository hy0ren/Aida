import { ObjectId } from "mongodb";
import { demoData, type ConfirmationMessageResponse } from "@aida/shared";
import { demoConfirmationResponse } from "@/app/api/_mock/aida-demo";
import { getUserById } from "@/lib/auth-service";
import { collections, getDb, isMongoConfigured } from "@/lib/mongodb";

export type ConfirmationRequestBody = {
  appointmentId?: string;
  patientId?: string;
  patientName?: string;
  expoPushToken?: string;
  language?: string;
  title?: string;
  message?: string;
  doctor?: string;
  clinicName?: string;
  scheduledAt?: string;
};

function normalizeLanguage(language?: string) {
  return (language || "English").trim().toLowerCase();
}

async function resolvePatientName(body: ConfirmationRequestBody): Promise<string | undefined> {
  if (body.patientName?.trim()) return body.patientName.trim();
  if (!body.patientId?.trim()) return undefined;
  const result = await getUserById(body.patientId).catch(() => null);
  return result?.user?.name;
}

function formatAppointmentTime(value?: string, locale = "en-US") {
  if (!value) return "the scheduled time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function buildConfirmationMessage(
  body: ConfirmationRequestBody,
): Pick<ConfirmationMessageResponse, "title" | "message"> {
  const language = normalizeLanguage(body.language);
  const patientName = body.patientName?.trim() || "there";
  const doctor = body.doctor || demoData.providers[0].doctor;
  const clinic = body.clinicName || demoData.providers[0].name;

  if (language.includes("spanish") || language === "es") {
    return {
      title: "Cita confirmada",
      message: `Aida: ${patientName}, tu cita con ${doctor} en ${clinic} esta confirmada para ${formatAppointmentTime(body.scheduledAt, "es-US")}. Abre Aida para ver que traer.`,
    };
  }
  if (language.includes("korean") || language === "ko") {
    return {
      title: "예약이 확정되었습니다",
      message: `Aida: ${patientName}님, ${clinic}의 ${doctor} 진료 예약이 ${formatAppointmentTime(body.scheduledAt, "ko-KR")}로 확정되었습니다. 준비물을 보려면 Aida를 열어 주세요.`,
    };
  }
  if (language.includes("chinese") || language === "zh") {
    return {
      title: "预约已确认",
      message: `Aida：${patientName}，您与 ${clinic} 的 ${doctor} 的预约已确认，时间是 ${formatAppointmentTime(body.scheduledAt, "zh-CN")}。请打开 Aida 查看需要携带的物品。`,
    };
  }
  if (language.includes("arabic") || language === "ar") {
    return {
      title: "تم تأكيد الموعد",
      message: `Aida: ${patientName}، تم تأكيد موعدك مع ${doctor} في ${clinic} في ${formatAppointmentTime(body.scheduledAt, "ar")} . افتح Aida لمعرفة ما يجب إحضاره.`,
    };
  }
  if (language.includes("hindi") || language === "hi") {
    return {
      title: "अपॉइंटमेंट पक्का हो गया",
      message: `Aida: ${patientName}, ${clinic} में ${doctor} के साथ आपकी अपॉइंटमेंट ${formatAppointmentTime(body.scheduledAt, "hi-IN")} के लिए पक्की हो गई है। क्या लाना है देखने के लिए Aida खोलें।`,
    };
  }
  if (language.includes("french") || language === "fr") {
    return {
      title: "Rendez-vous confirme",
      message: `Aida : ${patientName}, votre rendez-vous avec ${doctor} a ${clinic} est confirme pour ${formatAppointmentTime(body.scheduledAt, "fr-FR")}. Ouvrez Aida pour voir quoi apporter.`,
    };
  }
  if (language.includes("tagalog") || language === "tl") {
    return {
      title: "Kumpirmado ang appointment",
      message: `Aida: ${patientName}, kumpirmado ang appointment mo kay ${doctor} sa ${clinic} sa ${formatAppointmentTime(body.scheduledAt, "en-PH")}. Buksan ang Aida para makita ang dadalhin.`,
    };
  }
  if (language.includes("vietnamese") || language === "vi") {
    return {
      title: "Lich hen da duoc xac nhan",
      message: `Aida: ${patientName}, lich hen cua ban voi ${doctor} tai ${clinic} da duoc xac nhan vao ${formatAppointmentTime(body.scheduledAt, "vi-VN")}. Mo Aida de xem can mang theo gi.`,
    };
  }
  if (language.includes("portuguese") || language === "pt") {
    return {
      title: "Consulta confirmada",
      message: `Aida: ${patientName}, sua consulta com ${doctor} na ${clinic} esta confirmada para ${formatAppointmentTime(body.scheduledAt, "pt-BR")}. Abra o Aida para ver o que levar.`,
    };
  }

  return {
    title: "Appointment confirmed",
    message: `Aida: ${patientName}, your appointment with ${doctor} at ${clinic} is confirmed for ${formatAppointmentTime(body.scheduledAt)}. Open Aida to see what to bring.`,
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
  const resolvedPatientName = await resolvePatientName(body);
  const requestBody = { ...body, patientName: resolvedPatientName ?? body.patientName };
  const appointmentId = body.appointmentId ?? demoConfirmationResponse.appointmentId;
  const patientId = body.patientId ?? demoConfirmationResponse.patientId;
  const confirmationId = `confirm-${new ObjectId().toString()}`;
  const content = buildConfirmationMessage(requestBody);
  const title = body.title ?? content.title;
  const message = body.message ?? content.message;
  const language = body.language ?? "English";
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
