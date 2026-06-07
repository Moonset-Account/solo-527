import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const exportRouter = createTRPCRouter({
  generate: publicProcedure
    .input(
      z.object({
        type: z.enum(["funnel", "waitlist", "ranking", "adjustHistory"]),
        filters: z
          .object({
            campusIds: z.array(z.string()).optional(),
            courseIds: z.array(z.string()).optional(),
            ageGroups: z.array(z.string()).optional(),
            channels: z.array(z.string()).optional(),
            dateRange: z
              .object({
                start: z.date(),
                end: z.date(),
              })
              .optional(),
          })
          .optional(),
        includeAdjustDiff: z.boolean().default(false),
        format: z.enum(["xlsx", "csv"]).default("xlsx"),
      }),
    )
    .mutation(({ input }) => {
      const timestamp = Date.now();
      const typeLabel: Record<string, string> = {
        funnel: "漏斗分析",
        waitlist: "候补名单",
        ranking: "课程排名",
        adjustHistory: "调整记录",
      };

      const filename = `${typeLabel[input.type]}_${timestamp}.${input.format}`;
      const downloadUrl = `/api/export/${filename}`;

      return { downloadUrl };
    }),
});
