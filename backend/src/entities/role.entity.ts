import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from './user-role.entity';
import { RolePermission } from './role-permission.entity';

export enum RoleCode {
  SUPER_ADMIN = 'super_admin',
  LEGAL_ADMIN = 'legal_admin',
  CONTRACT_MANAGER = 'contract_manager',
  APPROVER = 'approver',
  APPLICANT = 'applicant',
  VIEWER = 'viewer',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, comment: '角色编码' })
  code: string;

  @Column({ type: 'varchar', length: 100, comment: '角色名称' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: '角色描述' })
  description: string;

  @Column({ type: 'integer', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'boolean', default: true, comment: '是否启用' })
  enabled: boolean;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions: RolePermission[];

  @CreateDateColumn({ type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', comment: '更新时间' })
  updatedAt: Date;
}
