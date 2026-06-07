import { getDataSet, filterByParams } from './mockData.js';
import type { RawConsultation } from './mockData.js';

interface CleanResult {
  duplicatesRemoved: number;
  statusAnomalies: number;
  sensitiveMasked: number;
  totalRecords: number;
}

export function cleanData(): CleanResult {
  const data = getDataSet();
  let duplicatesRemoved = 0;
  let statusAnomalies = 0;
  let sensitiveMasked = 0;

  const seen = new Map<string, string>();
  const deduped: RawConsultation[] = [];
  for (const con of data.consultations) {
    const key = `${con.customerId}:${con.projectId}:${con.createdAt.substring(0, 10)}`;
    if (seen.has(key)) {
      const existingDate = seen.get(key)!;
      const existingTime = new Date(existingDate).getTime();
      const currentTime = new Date(con.createdAt).getTime();
      if (currentTime < existingTime) {
        const idx = deduped.findIndex((d) => d.customerId === con.customerId && d.projectId === con.projectId && d.createdAt.substring(0, 10) === con.createdAt.substring(0, 10));
        if (idx >= 0) deduped[idx] = con;
        seen.set(key, con.createdAt);
      }
      duplicatesRemoved++;
    } else {
      seen.set(key, con.createdAt);
      deduped.push(con);
    }
  }
  data.consultations = deduped;

  const validConsultationIds = new Set(data.consultations.map((c) => c.id));
  const validAppointmentIds = new Set(data.appointments.map((a) => a.id));
  const validVisitIds = new Set(data.visits.map((v) => v.id));
  const validPlanIds = new Set(data.treatmentPlans.map((p) => p.id));

  const orphanPayments = data.payments.filter(
    (p) => !validPlanIds.has(p.planId),
  );
  statusAnomalies += orphanPayments.length;

  const orphanFollowUps = data.followUps.filter(
    (f) => !data.payments.some((p) => p.id === f.paymentId),
  );
  statusAnomalies += orphanFollowUps.length;

  for (const plan of data.treatmentPlans) {
    if (plan.isSensitive) {
      sensitiveMasked++;
    }
  }

  return {
    duplicatesRemoved,
    statusAnomalies,
    sensitiveMasked,
    totalRecords:
      data.consultations.length +
      data.appointments.length +
      data.visits.length +
      data.treatmentPlans.length +
      data.payments.length +
      data.followUps.length,
  };
}

export function validatePipeline(): boolean {
  const data = getDataSet();
  const consultationIds = new Set(data.consultations.map((c) => c.id));
  const appointmentIds = new Set(data.appointments.map((a) => a.id));
  const visitIds = new Set(data.visits.map((v) => v.id));

  for (const apt of data.appointments) {
    if (!consultationIds.has(apt.consultationId)) return false;
  }
  for (const vis of data.visits) {
    if (!appointmentIds.has(vis.appointmentId)) return false;
  }
  for (const plan of data.treatmentPlans) {
    if (!visitIds.has(plan.visitId)) return false;
  }

  return true;
}
