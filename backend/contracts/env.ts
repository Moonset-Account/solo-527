/**
 * Contract source: https://git.io/JTm6U
 *
 * Feel free to let us know via PR, if you find something broken in this contract
 * file.
 */

declare module '@ioc:Adonis/Core/Env' {
  type CustomTypes = typeof import('../env').default
  interface EnvTypes extends CustomTypes {
    PORT: number
    HOST: string
    NODE_ENV: string
    APP_KEY: string
    DRIVE_DISK: string
    DB_CONNECTION: string
    PG_HOST: string
    PG_PORT: number
    PG_USER: string
    PG_PASSWORD: string
    PG_DB_NAME: string
    REDIS_CONNECTION: string
    REDIS_HOST: string
    REDIS_PORT: number
    REDIS_PASSWORD: string
  }
}
