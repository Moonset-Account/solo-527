import { z } from "zod";
import { router, protectedProcedure, adminProcedure, frontlineProcedure, auditedProcedure } from "@/server/api/trpc";
import { AssignmentStatus, AssignmentType, Priority, type Assignment } from "@prisma/client";
import { recordChanges, getChangeHistory } from "@/server/services/auditService";

export const assignmentRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.array(z.enum([AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS, AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED])).optional(),
        type: z.array(z.enum([AssignmentType.COLLECTION, AssignmentType.REPAIR, AssignmentType.VISIT, AssignmentType.COMPLAINT])).optional(),
        priority: z.array(z.enum([Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT])).optional(),
        assigneeId: z.string().optional(),
        mineOnly: z.boolean().default(false),
        tenantName: z.string().optional(),
        propertyName: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, type, priority, assigneeId, mineOnly, tenantName, propertyName } = input;

      const where: any = {};
      if (status?.length) where.status = { in: status };
      if (type?.length) where.type = { in: type };
      if (priority?.length) where.priority = { in: priority };
      if (assigneeId) where.assigneeId = assigneeId;
      if (mineOnly) where.assigneeId = ctx.user.id;
      if (tenantName) where.lease = { tenant: { name: { contains: tenantName, mode: "insensitive" } } };
      if (propertyName) where.lease = { ...where.lease, property: { name: { contains: propertyName, mode: "insensitive" } } };

      const [total, assignments] = await Promise.all([
        ctx.db.assignment.count({ where }),
        ctx.db.assignment.findMany({
          where,
          include: {
            assignee: { select: { id: true, name: true, role: true } },
            lease: {
              include: {
                property: { select: { name: true, address: true } },
                tenant: { select: { name: true, phone: true } },
              },
            },
            bill: { select: { id: true, billNo: true, amount: true, status: true } },
          },
          orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        assignments: assignments.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          priority: a.priority,
          status: a.status,
          description: a.description,
          handleNote: a.handleNote,
          satisfactionScore: a.satisfactionScore,
          assignee: a.assignee,
          propertyName: a.lease.property.name,
          propertyAddress: a.lease.property.address,
          tenantName: a.lease.tenant.name,
          tenantPhone: a.lease.tenant.phone,
          bill: a.bill,
          completedAt: a.completedAt,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        })),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const assignment = await ctx.db.assignment.findUnique({
        where: { id: input.id },
        include: {
          assignee: { select: { id: true, name: true, role: true, email: true } },
          lease: {
            include: {
              property: { select: { name: true, address: true } },
              tenant: { select: { name: true, phone: true, email: true } },
              owner: { select: { name: true, phone: true } },
            },
          },
          bill: {
            include: {
              exception: true,
            },
          },
        },
      });

      if (!assignment) return null;

      const changeHistory = await getChangeHistory("ASSIGNMENT", assignment.id);

      return {
        ...assignment,
        changeHistory,
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        leaseId: z.string(),
        billId: z.string().optional(),
        type: z.enum([AssignmentType.COLLECTION, AssignmentType.REPAIR, AssignmentType.VISIT, AssignmentType.COMPLAINT]),
        priority: z.enum([Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT]),
        assigneeId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.assignment.create({ data: input });
    }),

  updateStatus: auditedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS, AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status, reason } = input;

      const oldAssignment = await ctx.db.assignment.findUnique({ where: { id } });
      if (!oldAssignment) throw new Error("工单不存在");

      const updateData = { status };
      if (status === AssignmentStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }

      const [updated] = await Promise.all([
        ctx.db.assignment.update({ where: { id }, data: updateData as Partial<Assignment> }),
        recordChanges("ASSIGNMENT", id, oldAssignment, updateData as Partial<Assignment>, ctx.user, reason),
      ]);

      return updated;
    }),

  complete: frontlineProcedure
    .input(
      z.object({
        id: z.string(),
        handleNote: z.string().min(1),
        satisfactionScore: z.number().min(1).max(5).optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, handleNote, satisfactionScore, reason } = input;

      const oldAssignment = await ctx.db.assignment.findUnique({ where: { id } });
      if (!oldAssignment) throw new Error("工单不存在");

      const updateData = {
        status: AssignmentStatus.COMPLETED,
        handleNote,
        satisfactionScore,
        completedAt: new Date(),
      };

      const [updated] = await Promise.all([
        ctx.db.assignment.update({ where: { id }, data: updateData as Partial<Assignment> }),
        recordChanges("ASSIGNMENT", id, oldAssignment, updateData as Partial<Assignment>, ctx.user, reason || "工单办结"),
      ]);

      return updated;
    }),

  assign: adminProcedure
    .input(
      z.object({
        id: z.string(),
        assigneeId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, assigneeId, reason } = input;

      const oldAssignment = await ctx.db.assignment.findUnique({ where: { id } });
      if (!oldAssignment) throw new Error("工单不存在");

      const updateData = { assigneeId, status: AssignmentStatus.PENDING };

      const [updated] = await Promise.all([
        ctx.db.assignment.update({ where: { id }, data: updateData as Partial<Assignment> }),
        recordChanges("ASSIGNMENT", id, oldAssignment, updateData as Partial<Assignment>, ctx.user, reason || "重新分配"),
      ]);

      return updated;
    }),

  getMyTodo: frontlineProcedure.query(async ({ ctx }) => {
    const assignments = await ctx.db.assignment.findMany({
      where: {
        assigneeId: ctx.user.id,
        status: { in: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS] },
      },
      include: {
        lease: {
          include: {
            property: { select: { name: true } },
            tenant: { select: { name: true, phone: true } },
          },
        },
        bill: { select: { billNo: true, amount: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 20,
    });

    return assignments.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      priority: a.priority,
      status: a.status,
      propertyName: a.lease.property.name,
      tenantName: a.lease.tenant.name,
      tenantPhone: a.lease.tenant.phone,
      billNo: a.bill?.billNo,
      billAmount: a.bill?.amount.toNumber(),
      createdAt: a.createdAt,
    }));
  }),

  getWorkbenchData: frontlineProcedure.query(async ({ ctx }) => {
    const [pending, inProgress, completedToday, total] = await Promise.all([
      ctx.db.assignment.count({
        where: { assigneeId: ctx.user.id, status: AssignmentStatus.PENDING },
      }),
      ctx.db.assignment.count({
        where: { assigneeId: ctx.user.id, status: AssignmentStatus.IN_PROGRESS },
      }),
      ctx.db.assignment.count({
        where: {
          assigneeId: ctx.user.id,
          status: AssignmentStatus.COMPLETED,
          completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      ctx.db.assignment.count({ where: { assigneeId: ctx.user.id } }),
    ]);

    return { pending, inProgress, completedToday, total };
  }),
});
