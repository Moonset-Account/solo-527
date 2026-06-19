import { createTRPCRouter } from './trpc'
import { supplyRouter } from './routes/supply'
import { procurementRouter } from './routes/procurement'
import { reconciliationRouter } from './routes/reconciliation'
import { riskRouter } from './routes/risk'

export const appRouter = createTRPCRouter({
  supply: supplyRouter,
  procurement: procurementRouter,
  reconciliation: reconciliationRouter,
  risk: riskRouter,
})

export type AppRouter = typeof appRouter
