import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole, UserStatus } from '../../common/enums/user.enum';
import { Material } from '../../modules/materials/entities/material.entity';
import { Order } from '../../modules/orders/entities/order.entity';
import { Settlement } from '../../modules/settlements/entities/settlement.entity';
import { ExceptionRecord } from '../../modules/exceptions/entities/exception-record.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ length: 255, select: false })
  password: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 100, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'text', nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'settlement_ratio' })
  settlementRatio: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @OneToMany(() => Material, (material) => material.photographer)
  materials: Material[];

  @OneToMany(() => Order, (order) => order.client)
  clientOrders: Order[];

  @OneToMany(() => Order, (order) => order.photographer)
  photographerOrders: Order[];

  @OneToMany(() => Settlement, (settlement) => settlement.photographer)
  settlements: Settlement[];

  @OneToMany(() => ExceptionRecord, (ex) => ex.handler)
  handledExceptions: ExceptionRecord[];
}
