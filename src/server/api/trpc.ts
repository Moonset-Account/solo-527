import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const clerkUser = await currentUser()
  let user = null

  if (clerkUser) {
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (email) {
      user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } })
      if (!user) {
        user = await prisma.user.create({
          data: {
            clerkId: clerkUser.id,
            email,
            name: clerkUser.fullName || clerkUser.firstName || email.split('@')[0],
          },
        })
      }
    }
  }

  return {
    user,
    prisma,
    ...opts,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})
export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { user: ctx.user } })
})

export const protectedProcedure = t.procedure.use(isAuthed)

const isRepresentativeOrAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || (ctx.user.role !== 'REPRESENTATIVE' && ctx.user.role !== 'ADMIN')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要居民代表或管理员权限' })
  }
  return next({ ctx: { user: ctx.user } })
})

export const representativeProcedure = t.procedure.use(isRepresentativeOrAdmin)

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理员权限' })
  }
  return next({ ctx: { user: ctx.user } })
})

export const adminProcedure = t.procedure.use(isAdmin)

const isAuditorOrAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || (ctx.user.role !== 'ADMIN' && ctx.user.role !== 'AUDITOR')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理员或审计员权限' })
  }
  return next({ ctx: { user: ctx.user } })
})

export const auditorProcedure = t.procedure.use(isAuditorOrAdmin)

export const createCallerFactory = t.createCallerFactory
