import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum UserRole {
  IT_SUPERVISOR = 'IT_SUPERVISOR',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.IT_SUPERVISOR })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
