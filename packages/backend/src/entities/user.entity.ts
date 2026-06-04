import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum UserRole {
  ADMIN = 'admin',
  SALES = 'sales',
  PRODUCT_MANAGER = 'product_manager',
  SUPERVISOR = 'supervisor',
  FINANCE = 'finance',
  OPERATION = 'operation',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.SALES,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  department: string;
}
