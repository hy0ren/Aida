import { ObjectId } from "mongodb";
import { demoData, type AppointmentResponse, type ListAppointmentsData } from "@aida/shared";
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

export async function listAppointmentsByPatientId(
  patientId: string
): Promise<{ data: ListAppointmentsData; source: "database" | "demo" }> {
  if (!isMongoConfigured()) {
    return { data: { items: [] }, source: "demo" };
  }
  const db = await getDb();
  if (!db) {
    return { data: { items: [] }, source: "demo" };
  }

  const docs = await db
    .collection(collections.appointments)
    .find({ patientId }, { sort: { createdAt: -1 } })
    .project({
      _id: 0,
      appointmentId: 1,
      patientId: 1,
      providerId: 1,
      doctor: 1,
      specialty: 1,
      clinicName: 1,
      address: 1,
      scheduledAt: 1,
      status: 1,
      preparation: 1,
    })
    .toArray();

  return { data: { items: docs as AppointmentResponse[] }, source: "database" };
}
