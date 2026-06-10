import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import WorkOrderMaterial from './WorkOrderMaterial'

export default class Material extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public materialCode: string

  @column()
  public materialName: string

  @column()
  public specification: string | null

  @column()
  public unit: string | null

  @column()
  public stockQuantity: number

  @column()
  public safetyStock: number

  @column()
  public supplier: string | null

  @column()
  public unitPrice: number | null

  @column()
  public remarks: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => WorkOrderMaterial)
  public workOrderMaterials: HasMany<typeof WorkOrderMaterial>
}
