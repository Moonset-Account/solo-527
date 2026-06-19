import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { prisma } from './prisma'
import { auth, clerkClient } from '@clerk/nextjs/server'
import type { UserRole } from '@prisma/client'

export const createTRPCContext = async () => {
  const { userId } = await auth()

  let user = null
  let role: UserRole = 'EMPLOYEE'

  if (userId) {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (dbUser) {
      user = dbUser
      role = dbUser.role
    } else {
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
      const name = `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim()

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email,
          name,
          role: 'EMPLOYEE',
        },
      })
      role = user.role
    }
  }

  return {
    prisma,
    userId,
    user,
    role,
  }
}

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<TRPCContext>().create({
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
export const router = t.router

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      userId: ctx.userId,
      user: ctx.user,
      role: ctx.role,
    },
  })
})

export const protectedProcedure = t.procedure.use(isAuthed)

export const requireRole = (...roles: UserRole[]) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!roles.includes(ctx.role)) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
    return next()
  })
