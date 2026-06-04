import { z } from 'zod';
import { router, protectedProcedure, mentorProcedure } from '../trpc';
import { prisma } from '../db';

export const projectRouter = router({
  create: mentorProcedure
    .input(
      z.object({
        name: z.string(),
        projectNumber: z.string(),
        description: z.string().optional(),
        memberIds: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { memberIds, ...data } = input;
      return prisma.project.create({
        data: {
          ...data,
          mentorId: ctx.user.id,
          members: {
            connect: memberIds.map((id) => ({ id })),
          },
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const project = await prisma.project.findUnique({
        where: { id: input.id },
        include: {
          mentor: { select: { id: true, name: true, email: true } },
          members: { select: { id: true, name: true, email: true } },
          bookings: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              device: { select: { id: true, name: true } },
          },
        },
      });

      if (!project) {
        throw new Error('项目不存在');
      }

      if (
        ctx.user.role !== 'ADMIN' &&
        ctx.user.id !== project.mentorId &&
        !project.members.some((m) => m.id === ctx.user.id)
      ) {
        throw new Error('无权限查看此项目');
      }

      return project;
    }),

  addMember: mentorProcedure
    .input(
      z.object({
        projectId: z.string(),
        memberId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project || project.mentorId !== ctx.user.id) {
        throw new Error('无权限修改此项目');
      }

      return prisma.project.update({
        where: { id: input.projectId },
        data: {
          members: {
            connect: { id: input.memberId },
          },
        },
        include: { members: true },
      });
    }),
});
