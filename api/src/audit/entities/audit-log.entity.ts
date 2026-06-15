import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TargetType } from '../../../../shared/types.js';
import { User } from '../../user/entities/user.entity.js';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'operator_id' })
  operator: User | null;

  @Column()
  action: string;

  @Column({ name: 'target_type', type: 'enum', enum: TargetType })
  targetType: TargetType;

  @Column({ name: 'target_id' })
  targetId: number;

  @Column({ name: 'before_data', type: 'simple-json', nullable: true })
  beforeData: Record<string, unknown> | null;

  @Column({ name: 'after_data', type: 'simple-json', nullable: true })
  afterData: Record<string, unknown> | null;

  @Column({ name: 'is_failed', default: false })
  isFailed: boolean;

  @Column({ name: 'fail_reason', type: 'text', nullable: true })
  failReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
