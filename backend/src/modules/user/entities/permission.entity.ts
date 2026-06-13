import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ name: 'code', length: 100, unique: true, nullable: false })
  code: string;

  @Column({ name: 'name', length: 100, nullable: false })
  name: string;

  @Column({ name: 'module', length: 50, nullable: false })
  module: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];
}
