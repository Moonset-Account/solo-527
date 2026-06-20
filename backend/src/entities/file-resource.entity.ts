import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('file_resources')
@Index(['resourceKey'], { unique: true })
@Index(['lockerId'])
@Index(['lockedAt'])
export class FileResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500, unique: true, comment: '资源唯一键' })
  resourceKey: string;

  @Column({ type: 'varchar', length: 255, comment: '资源名称' })
  resourceName: string;

  @Column({ type: 'varchar', length: 50, comment: '资源类型' })
  resourceType: string;

  @Column({ type: 'bigint', default: 0, comment: '占用大小(字节)' })
  size: number;

  @Column({ type: 'boolean', default: false, comment: '是否锁定' })
  isLocked: boolean;

  @Column({ type: 'uuid', nullable: true, comment: '锁定者ID' })
  lockerId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '锁定者姓名' })
  lockerName: string;

  @Column({ type: 'uuid', nullable: true, comment: '所属合同ID' })
  contractId: string;

  @Column({ type: 'text', nullable: true, comment: '资源描述' })
  description: string;

  @Column({ type: 'timestamptz', nullable: true, comment: '锁定开始时间' })
  lockedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, comment: '锁定过期时间' })
  lockExpireAt: Date;

  @CreateDateColumn({ type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;
}
