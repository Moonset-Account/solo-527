import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  DOWNLOAD = 'download',
  UPLOAD = 'upload',
  APPROVE = 'approve',
  REJECT = 'reject',
  TRANSFER = 'transfer',
  ARCHIVE = 'archive',
  LOCK = 'lock',
  UNLOCK = 'unlock',
  LOGIN = 'login',
  LOGOUT = 'logout',
  CONFLICT_REPORT = 'conflict_report',
  CONFLICT_RESOLVE = 'conflict_resolve',
}

@Entity('audit_logs')
@Index(['userId', 'action', 'createdAt'])
@Index(['targetId', 'targetType'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, comment: '操作人ID' })
  userId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '操作人姓名' })
  userName: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
    comment: '操作类型',
  })
  action: AuditAction;

  @Column({ type: 'varchar', length: 50, comment: '目标类型' })
  targetType: string;

  @Column({ type: 'uuid', nullable: true, comment: '目标ID' })
  targetId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '目标名称' })
  targetName: string;

  @Column({ type: 'json', nullable: true, comment: '变更前数据' })
  beforeData: Record<string, any>;

  @Column({ type: 'json', nullable: true, comment: '变更后数据' })
  afterData: Record<string, any>;

  @Column({ type: 'text', nullable: true, comment: '操作备注' })
  remark: string;

  @Column({ type: 'varchar', length: 45, nullable: true, comment: 'IP地址' })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: 'UserAgent' })
  userAgent: string;

  @CreateDateColumn({ type: 'timestamptz', comment: '操作时间' })
  createdAt: Date;
}
