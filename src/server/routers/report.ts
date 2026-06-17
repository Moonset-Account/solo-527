import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";

type AppointmentStatusKey = "SCHEDULED" | "CONFLICT" | "RESCHEDULED" | "CANCELLED";

export const reportRouter = createTRPCRouter({
  getFollowUpRate: publicProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};
      if (input.startDate || input.endDate) {
        const createdAt: Record<string, Date> = {};
        if (input.startDate) createdAt.gte = input.startDate;
        if (input.endDate) createdAt.lte = input.endDate;
        where.createdAt = createdAt;
      }

      const [total, completed] = await Promise.all([
        prisma.followUpTask.count({ where }),
        prisma.followUpTask.count({
          where: { ...where, status: "COMPLETED" },
        }),
      ]);

      const rate = total > 0 ? completed / total : 0;

      return { total, completed, rate };
    }),

  getFollowUpRateTrend: publicProcedure.query(async () => {
    const tasks = await prisma.followUpTask.findMany({
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    });

    const monthlyData: Record<
      string,
      { total: number; completed: number }
    > = {};

    for (const task of tasks) {
      const month = task.createdAt.toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, completed: 0 };
      }
      monthlyData[month].total++;
      if (task.status === "COMPLETED") {
        monthlyData[month].completed++;
      }
    }

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        rate: data.total > 0 ? data.completed / data.total : 0,
      }));
  }),

  getFollowUpRateByDoctor: publicProcedure.query(async () => {
    const tasks = await prisma.followUpTask.findMany({
      include: {
        medicalRecord: { select: { doctorId: true } },
      },
    });

    const byDoctor: Record<
      string,
      { total: number; completed: number }
    > = {};

    for (const task of tasks) {
      const doctorId = task.medicalRecord.doctorId;
      if (!byDoctor[doctorId]) {
        byDoctor[doctorId] = { total: 0, completed: 0 };
      }
      byDoctor[doctorId].total++;
      if (task.status === "COMPLETED") {
        byDoctor[doctorId].completed++;
      }
    }

    return Object.entries(byDoctor).map(([doctorId, data]) => ({
      doctorId,
      total: data.total,
      completed: data.completed,
      rate: data.total > 0 ? data.completed / data.total : 0,
    }));
  }),

  getAppointmentStatusDistribution: publicProcedure.query(async () => {
    const all = await prisma.appointment.findMany({
      select: { status: true, appointmentDate: true },
      orderBy: { appointmentDate: "asc" },
    });

    const statuses: AppointmentStatusKey[] = [
      "SCHEDULED",
      "CONFLICT",
      "RESCHEDULED",
      "CANCELLED",
    ];
    const total = all.length;

    const byStatus: Record<AppointmentStatusKey, number> = {
      SCHEDULED: 0,
      CONFLICT: 0,
      RESCHEDULED: 0,
      CANCELLED: 0,
    };

    for (const a of all) {
      byStatus[a.status as AppointmentStatusKey]++;
    }

    const monthlyByStatus: Record<string, Record<AppointmentStatusKey, number>> = {};
    for (const a of all) {
      const m = a.appointmentDate.toISOString().slice(0, 7);
      if (!monthlyByStatus[m]) {
        monthlyByStatus[m] = { SCHEDULED: 0, CONFLICT: 0, RESCHEDULED: 0, CANCELLED: 0 };
      }
      monthlyByStatus[m][a.status as AppointmentStatusKey]++;
    }

    return {
      total,
      byStatus: statuses.map((s) => ({
        status: s,
        count: byStatus[s],
        rate: total > 0 ? byStatus[s] / total : 0,
      })),
      monthly: Object.entries(monthlyByStatus)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, d]) => ({
          month,
          scheduled: d.SCHEDULED,
          conflict: d.CONFLICT,
          rescheduled: d.RESCHEDULED,
          cancelled: d.CANCELLED,
        })),
    };
  }),

  getAppointmentImpactOnFollowUp: publicProcedure.query(async () => {
    const tasks = await prisma.followUpTask.findMany({
      where: { patientId: { not: "" } },
      select: { id: true, status: true, patientId: true, dueDate: true },
    });

    const appointments = await prisma.appointment.findMany({
      select: { patientId: true, status: true, appointmentDate: true },
    });

    const patientAppointments: Record<string, typeof appointments> = {};
    for (const a of appointments) {
      if (!patientAppointments[a.patientId]) {
        patientAppointments[a.patientId] = [];
      }
      patientAppointments[a.patientId].push(a);
    }

    const buckets = {
      hasScheduled: { total: 0, completed: 0 },
      hasRescheduled: { total: 0, completed: 0 },
      hasConflict: { total: 0, completed: 0 },
      hasCancelled: { total: 0, completed: 0 },
      noAppointment: { total: 0, completed: 0 },
    };

    for (const t of tasks) {
      const pas = patientAppointments[t.patientId] ?? [];
      const statuses = new Set(pas.map((p) => p.status));
      const completed = t.status === "COMPLETED" ? 1 : 0;
      const total = 1;

      if (statuses.size === 0) {
        buckets.noAppointment.total += total;
        buckets.noAppointment.completed += completed;
      }
      if (statuses.has("SCHEDULED")) {
        buckets.hasScheduled.total += total;
        buckets.hasScheduled.completed += completed;
      }
      if (statuses.has("RESCHEDULED")) {
        buckets.hasRescheduled.total += total;
        buckets.hasRescheduled.completed += completed;
      }
      if (statuses.has("CONFLICT")) {
        buckets.hasConflict.total += total;
        buckets.hasConflict.completed += completed;
      }
      if (statuses.has("CANCELLED")) {
        buckets.hasCancelled.total += total;
        buckets.hasCancelled.completed += completed;
      }
    }

    const rate = (n: { total: number; completed: number }) =>
      n.total > 0 ? n.completed / n.total : 0;

    return {
      items: [
        {
          label: "有预约记录",
          bucket: "hasScheduled",
          status: "SCHEDULED",
          total: buckets.hasScheduled.total,
          completed: buckets.hasScheduled.completed,
          rate: rate(buckets.hasScheduled),
        },
        {
          label: "已改期",
          bucket: "hasRescheduled",
          status: "RESCHEDULED",
          total: buckets.hasRescheduled.total,
          completed: buckets.hasRescheduled.completed,
          rate: rate(buckets.hasRescheduled),
        },
        {
          label: "有号源冲突",
          bucket: "hasConflict",
          status: "CONFLICT",
          total: buckets.hasConflict.total,
          completed: buckets.hasConflict.completed,
          rate: rate(buckets.hasConflict),
        },
        {
          label: "已取消",
          bucket: "hasCancelled",
          status: "CANCELLED",
          total: buckets.hasCancelled.total,
          completed: buckets.hasCancelled.completed,
          rate: rate(buckets.hasCancelled),
        },
        {
          label: "无预约记录",
          bucket: "noAppointment",
          status: null,
          total: buckets.noAppointment.total,
          completed: buckets.noAppointment.completed,
          rate: rate(buckets.noAppointment),
        },
      ],
    };
  }),
});
