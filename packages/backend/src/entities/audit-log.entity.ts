import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  STATUS_CHANGE = 'status_change',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUBMIT = 'submit',
  SEND = 'send',
}

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ nullable: true })
  fieldName: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string;

  @Column({ type: 'text', nullable: true })
  newValue: string;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text', nullable: true })
  userIp: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
