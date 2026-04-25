import { ObjectId } from "mongodb";
import { demoData, type AppointmentResponse } from "@aida/shared";
import { demoAppointmentResponse } from "@/app/api/_mock/aida-demo";
import { collections, getDb, isMongoConfigured } from "@/lib/mongodb";

export type AppointmentRequestBody = {
  callSessionId?: string;
  providerId?: string;
  patientId?: string;
};

/**
 * Inserts a row into `appointments` when Mongo is configured; response shape is stable either way.
 */
export async function processCreateAppointment(
  body: AppointmentRequestBody
): Promise<{
  data: AppointmentResponse;
  source: "database" | "demo";
}> {
  const appointmentId = `appt-${new ObjectId().toString()}`;
  const patientId = body.patientId ?? demoData.patient.id;
  const providerId = body.providerId ?? demoAppointmentResponse.providerId;

  const data: AppointmentResponse = {
    ...demoAppointmentResponse,
    appointmentId,
    patientId,
    providerId,
  };

  if (isMongoConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection(collections.appointments).insertOne({
        _id: new ObjectId(),
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        providerId: data.providerId,
        doctor: data.doctor,
        specialty: data.specialty,
        clinicName: data.clinicName,
        address: data.address,
        scheduledAt: data.scheduledAt,
        status: data.status,
        preparation: data.preparation,
        callSessionId: body.callSessionId,
        createdAt: new Date(),
      });
      return { data, source: "database" };
    }
  }

  return { data, source: "demo" };
}
