import { createTRPCRouter, publicProcedure } from "../trpc";

export const metaRouter = createTRPCRouter({
  campuses: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.campus.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }),

  courses: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.course.findMany({
      select: { id: true, name: true, campusId: true },
      orderBy: { name: "asc" },
    });
  }),
});
