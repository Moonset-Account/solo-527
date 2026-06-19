import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/server'

export const api = createTRPCReact<AppRouter>()

type SafeUtils = {
  invalidate: () => Promise<void>
}

type AnyRouterUtils = {
  [k: string]: { [k: string]: SafeUtils } & SafeUtils
}

export function useApiUtils(): AnyRouterUtils {
  const m = api as unknown as { useUtils: () => AnyRouterUtils }
  return m.useUtils()
}
