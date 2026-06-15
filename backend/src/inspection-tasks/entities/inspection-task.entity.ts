import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

@Entity('inspection_tasks')
export class InspectionTask extends BaseEntity {
  @Column({ name: 'template_id' })
  templateId: string;

  @Column({ name: 'template_name' })
  templateName: string;

  @Column()
  assignee: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'simple-json', nullable: true })
  results: Record<string, any>;

  @Column({ nullable: true })
  notes: string;
}
