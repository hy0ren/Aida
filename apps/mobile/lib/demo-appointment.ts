import { demoData, type AppointmentResponse } from "@aida/shared";

/** Demo row when the API returns no stored appointments. */
export function buildDemoActiveAppointment(patientId: string): AppointmentResponse {
  return {
    appointmentId: demoData.selectedAppointment.id,
    patientId,
    providerId: demoData.selectedAppointment.providerId,
    doctor: demoData.providers[0].doctor,
    specialty: demoData.selectedAppointment.visitType,
    clinicName: demoData.providers[0].name,
    address: demoData.providers[0].address,
    scheduledAt: demoData.selectedAppointment.scheduledAt,
    status: "confirmed",
    preparation: [
      "Bring insurance card and photo ID",
      "Bring current medication list",
      "Arrive 10 minutes early",
    ],
  };
}
