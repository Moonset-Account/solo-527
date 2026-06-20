import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, comment: '权限编码' })
  code: string;

  @Column({ type: 'varchar', length: 100, comment: '权限名称' })
  name: string;

  @Column({ type: 'varchar', length: 50, comment: '所属模块' })
  module: string;

  @Column({ type: 'text', nullable: true, comment: '权限描述' })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '父级ID' })
  parentId: string;

  @Column({ type: 'integer', default: 0, comment: '排序' })
  sort: number;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];

  @CreateDateColumn({ type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;
}
