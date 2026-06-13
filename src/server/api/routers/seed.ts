import { router, publicProcedure } from "../trpc";
import { seedDatabase } from "../seed-data";

export const seedRouter = router({
  seedDemo: publicProcedure.mutation(async () => {
    const result = await seedDatabase();
    return result;
  }),
});
