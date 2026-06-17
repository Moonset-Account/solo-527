import { createCallerFactory, createTRPCRouter } from './trpc'
import { topicRouter } from './routers/topic'
import { facilityRouter } from './routers/facility'
import { volunteerRouter } from './routers/volunteer'
import { adminRouter } from './routers/admin'

export const appRouter = createTRPCRouter({
  topic: topicRouter,
  facility: facilityRouter,
  volunteer: volunteerRouter,
  admin: adminRouter,
})

export type AppRouter = typeof appRouter
export const createCaller = createCallerFactory(appRouter)
