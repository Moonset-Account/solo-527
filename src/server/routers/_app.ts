import { createTRPCRouter } from "../trpc";
import { patientRouter } from "./patient";
import { medicalRecordRouter } from "./medicalRecord";
import { followUpRouter } from "./followUp";
import { auditLogRouter } from "./auditLog";
import { reportRouter } from "./report";
import { appointmentRouter } from "./appointment";

export const appRouter = createTRPCRouter({
  patient: patientRouter,
  medicalRecord: medicalRecordRouter,
  followUp: followUpRouter,
  auditLog: auditLogRouter,
  report: reportRouter,
  appointment: appointmentRouter,
});

export type AppRouter = typeof appRouter;
