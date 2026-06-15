import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "../trpc";
import { ExportFormat, ExportStatus, LogAction, RepairStatus } from "@prisma/client";
import { logExport, createAuditLog } from "@/lib/audit-log";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";

async function generateExport(taskId: string, type: string, format: ExportFormat, filters: any, userId: string) {
  await prisma.exportTask.update({
    where: { id: taskId },
    data: {
      status: ExportStatus.PROCESSING,
      startedAt: new Date(),
    },
  });

  try {
    let data;
    let fileName: string;
    let fileUrl: string;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.dormNumber) where.dormNumber = filters.dormNumber;
    if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
    if (filters.dateTo) where.createdAt = { lte: new Date(filters.dateTo) };
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const repairs = await prisma.repairRequest.findMany({
      where,
      include: {
        reportedBy: { select: { id: true, name: true, email: true, studentId: true, dormNumber: true, roomNumber: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        photos: { select: { url: true, fileName: true } },
        comments: {
          where: { isInternal: false },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        complaints: true,
        refunds: true,
        relatedTrade: {
          include: {
            seller: { select: { name: true } },
            buyer: { select: { name: true } },
          },
        },
        activities: {
          select: { activityName: true, points: true, createdAt: true },
        },
        auditLogs: {
          where: { action: LogAction.STATUS_CHANGE },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            photos: true,
            comments: true,
            complaints: true,
            refunds: true,
            activities: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("报修记录");

    worksheet.columns = [
      { header: "报修ID", key: "id", width: 25 },
      { header: "标题", key: "title", width: 30 },
      { header: "分类", key: "category", width: 15 },
      { header: "状态", key: "status", width: 12 },
      { header: "优先级", key: "priority", width: 8 },
      { header: "宿舍楼", key: "dormNumber", width: 10 },
      { header: "房间号", key: "roomNumber", width: 10 },
      { header: "描述", key: "description", width: 40 },
      { header: "报修人", key: "reporterName", width: 15 },
      { header: "学号", key: "reporterStudentId", width: 15 },
      { header: "分配给", key: "assigneeName", width: 15 },
      { header: "预估费用", key: "estimatedCost", width: 12 },
      { header: "实际费用", key: "actualCost", width: 12 },
      { header: "照片数量", key: "photoCount", width: 10 },
      { header: "评论数量", key: "commentCount", width: 10 },
      { header: "活动参与次数", key: "activityCount", width: 15 },
      { header: "活动超额标记", key: "overLimit", width: 12 },
      { header: "最近变更时间", key: "lastChangeAt", width: 20 },
      { header: "最近变更内容", key: "lastChangeContent", width: 30 },
      { header: "关联交易", key: "relatedTrade", width: 30 },
      { header: "退款金额", key: "refundAmount", width: 12 },
      { header: "创建时间", key: "createdAt", width: 20 },
      { header: "完成时间", key: "completedAt", width: 20 },
    ];

    for (const repair of repairs) {
      const lastChange = repair.auditLogs[0];
      const activityCount = repair._count.activities;
      const overLimit = activityCount > 10 ? "是" : "否";
      const totalRefund = repair.refunds.reduce((sum, r) => sum + (r.status === "COMPLETED" ? r.amount.toNumber() : 0), 0);

      worksheet.addRow({
        id: repair.id,
        title: repair.title,
        category: repair.category,
        status: repair.status,
        priority: repair.priority,
        dormNumber: repair.dormNumber,
        roomNumber: repair.roomNumber,
        description: repair.description,
        reporterName: repair.reportedBy?.name,
        reporterStudentId: repair.reportedBy?.studentId,
        assigneeName: repair.assignedTo?.name,
        estimatedCost: repair.estimatedCost?.toNumber(),
        actualCost: repair.actualCost?.toNumber(),
        photoCount: repair._count.photos,
        commentCount: repair._count.comments,
        activityCount,
        overLimit,
        lastChangeAt: lastChange?.createdAt?.toISOString(),
        lastChangeContent: lastChange?.description,
        relatedTrade: repair.relatedTrade ? `${repair.relatedTrade.title} (${repair.relatedTrade.seller?.name} -> ${repair.relatedTrade.buyer?.name || "未交易"})` : "",
        refundAmount: totalRefund,
        createdAt: repair.createdAt.toISOString(),
        completedAt: repair.completedAt?.toISOString(),
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    fileName = `报修记录_${new Date().toISOString().slice(0, 10)}.xlsx`;

    await prisma.exportTask.update({
      where: { id: taskId },
      data: {
        status: ExportStatus.COMPLETED,
        fileName,
        recordCount: repairs.length,
        completedAt: new Date(),
      },
    });

    await createAuditLog({
      action: LogAction.DOWNLOAD,
      entityType: "ExportTask",
      entityId: taskId,
      userId,
      description: `导出报修记录，共 ${repairs.length} 条`,
    });

  } catch (error) {
    await prisma.exportTask.update({
      where: { id: taskId },
      data: {
        status: ExportStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "未知错误",
        completedAt: new Date(),
      },
    });
  }
}

export const exportRouter = createTRPCRouter({
  requestExport: adminProcedure
    .input(
      z.object({
        type: z.enum(["repairs", "complaints", "refunds", "trades"]),
        format: z.nativeEnum(ExportFormat).default(ExportFormat.EXCEL),
        filters: z.object({
          status: z.nativeEnum(RepairStatus).optional(),
          category: z.string().optional(),
          dormNumber: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          search: z.string().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.exportTask.create({
        data: {
          userId: ctx.userId,
          type: input.type,
          format: input.format,
          filters: input.filters as any,
        },
      });

      await logExport(
        "ExportTask",
        task.id,
        ctx.userId,
        `请求导出 ${input.type} 数据`
      );

      setImmediate(() => {
        generateExport(task.id, input.type, input.format, input.filters, ctx.userId);
      });

      return task;
    }),

  getTask: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.exportTask.findUnique({
        where: { id: input.id },
      });
    }),

  listTasks: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
        status: z.nativeEnum(ExportStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.status) where.status = input.status;
      if (ctx.user.role === "STUDENT") where.userId = ctx.userId;

      const skip = (input.page - 1) * input.pageSize;
      const take = input.pageSize;

      const [items, total] = await Promise.all([
        ctx.prisma.exportTask.findMany({
          where,
          include: {
            user: { select: { id: true, name: true } },
          },
          skip,
          take,
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.exportTask.count({ where }),
      ]);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  download: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.prisma.exportTask.findUnique({
        where: { id: input.id },
      });

      if (!task) {
        throw new Error("导出任务不存在");
      }

      if (task.userId !== ctx.userId && ctx.user.role === "STUDENT") {
        throw new Error("无权限下载此文件");
      }

      if (task.status !== "COMPLETED") {
        throw new Error("导出任务尚未完成");
      }

      await createAuditLog({
        action: LogAction.DOWNLOAD,
        entityType: "ExportTask",
        entityId: input.id,
        userId: ctx.userId,
        description: `下载导出文件: ${task.fileName}`,
      });

      return task;
    }),
});
