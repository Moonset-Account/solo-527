/**
 * Custom ORM query builder extensions
 */

import {
  ModelQueryBuilderContract as BaseModelQueryBuilderContract,
  LucidModel,
} from '@ioc:Adonis/Lucid/Orm'

declare module '@ioc:Adonis/Lucid/Orm' {
  interface ModelQueryBuilderContract<
    Model extends LucidModel,
    Result = InstanceType<Model>
  > extends BaseModelQueryBuilderContract<Model, Result> {
    if(condition: any, callback: (query: this) => void): this
  }
}
