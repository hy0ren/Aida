import type { AppointmentResponse } from "@aida/shared";

export function matchesAppointmentSearch(
  a: AppointmentResponse,
  q: string,
): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const blob = [a.clinicName, a.doctor, a.specialty, a.address, a.status, a.appointmentId]
    .join(" ")
    .toLowerCase();
  return blob.includes(s);
}

export function isNonCancelled(a: AppointmentResponse): boolean {
  return a.status !== "cancelled";
}

/** Schedule tab: only visits that are still on the calendar (not completed/cancelled). */
export function isUpcomingBookSlot(a: AppointmentResponse): boolean {
  if (a.status === "cancelled" || a.status === "completed") return false;
  if (a.status !== "pending" && a.status !== "confirmed") return false;
  const t = new Date(a.scheduledAt).getTime();
  if (Number.isNaN(t)) return true;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return t >= start.getTime();
}

export function byScheduledAtAsc(a: AppointmentResponse, b: AppointmentResponse): number {
  return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
}
