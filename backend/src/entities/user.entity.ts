import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { UserRole } from './user-role.entity';
import { Contract } from './contract.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
}

export enum UserDepartment {
  LEGAL = 'legal',
  FINANCE = 'finance',
  ADMIN = 'admin',
  BUSINESS = 'business',
  HR = 'hr',
  OTHER = 'other',
}

@Entity('users')
@Index(['username'], { unique: true })
@Index(['email'], { unique: true })
@Index(['phone'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, comment: '用户名' })
  username: string;

  @Column({ type: 'varchar', length: 255, comment: '密码哈希' })
  password: string;

  @Column({ type: 'varchar', length: 100, comment: '真实姓名' })
  realName: string;

  @Column({ type: 'varchar', length: 100, unique: true, comment: '邮箱' })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true, comment: '手机号' })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserDepartment,
    default: UserDepartment.OTHER,
    comment: '所属部门',
  })
  department: UserDepartment;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    comment: '状态',
  })
  status: UserStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '头像URL' })
  avatar: string;

  @Column({ type: 'json', nullable: true, comment: '扩展信息' })
  extra: Record<string, any>;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @OneToMany(() => Contract, (contract) => contract.applicant)
  appliedContracts: Contract[];

  @OneToMany(() => Contract, (contract) => contract.owner)
  ownedContracts: Contract[];

  @CreateDateColumn({ type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', comment: '更新时间' })
  updatedAt: Date;
}
