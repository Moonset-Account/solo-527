/**
 * Custom ORM query builder extensions
 */

declare module '@ioc:Adonis/Lucid/Orm' {
  interface ModelQueryBuilderContract<
    Model,
    Result
  > {
    if(condition: any, callback: (query: this) => void): this
  }
}
