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
  public specification: string | null = null

  @column()
  public unit: string | null = null

  @column()
  public stockQuantity: number = 0

  @column()
  public safetyStock: number = 0

  @column()
  public supplier: string | null = null

  @column()
  public unitPrice: number | null = null

  @column()
  public remarks: string | null = null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => WorkOrderMaterial)
  public workOrderMaterials: HasMany<typeof WorkOrderMaterial>
}
