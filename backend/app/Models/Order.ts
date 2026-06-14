import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import BrandPartnership from './BrandPartnership'
import OrderNode from './OrderNode'
import OrderComment from './OrderComment'
import OrderAttachment from './OrderAttachment'
import RefundException from './RefundException'

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public orderNo: string

  @column()
  public partnershipId: number | null

  @column()
  public userId: number | null

  @column()
  public type: string

  @column()
  public amount: number

  @column()
  public currency: string

  @column()
  public paymentMethod: string | null

  @column()
  public status: string

  @column()
  public paymentStatus: string

  @column.dateTime()
  public paidAt: DateTime | null

  @column()
  public transactionId: string | null

  @column()
  public remark: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  public user: BelongsTo<typeof User>

  @belongsTo(() => BrandPartnership, { foreignKey: 'partnershipId' })
  public partnership: BelongsTo<typeof BrandPartnership>

  @hasMany(() => OrderNode, { foreignKey: 'orderId' })
  public nodes: HasMany<typeof OrderNode>

  @hasMany(() => OrderComment, { foreignKey: 'orderId' })
  public comments: HasMany<typeof OrderComment>

  @hasMany(() => OrderAttachment, { foreignKey: 'orderId' })
  public attachments: HasMany<typeof OrderAttachment>

  @hasMany(() => RefundException, { foreignKey: 'orderId' })
  public refunds: HasMany<typeof RefundException>
}
