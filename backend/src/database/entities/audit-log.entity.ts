import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column()
  @Index()
  action: string;

  @Column()
  @Index()
  entityType: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ nullable: true })
  username: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  changedFields: string[];

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
