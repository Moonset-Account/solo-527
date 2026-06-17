import { defineConfig } from '@adonisjs/auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'
import type { InferAuthenticators, InferUsers } from '@adonisjs/auth/types'

const authConfig = defineConfig({
  default: 'web',
  guards: {
    web: sessionGuard({
      useRememberMeTokens: false,
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
    }),
  },
})

export default authConfig

declare module '@adonisjs/auth/types' {
  export interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module '@adonisjs/core/types' {
  interface EventsList {
    'auth:login:attempt': {
      guardName: string
      uid: string
      rememberMe: boolean
    }
    'auth:login': {
      guardName: string
      user: InferUsers<typeof authConfig>
      rememberMe: boolean
    }
    'auth:logout': {
      guardName: string
      user: InferUsers<typeof authConfig>
    }
  }
}
