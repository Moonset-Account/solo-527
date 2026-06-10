import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Project } from '../project/project.entity';
import { ConstructionStage } from '../construction-stage/construction-stage.entity';
import { DelayReminderStatus } from '../common/enums/delay-reminder-status.enum';

@Entity('delay_reminders')
export class DelayReminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ nullable: true })
  stageId: number;

  @ManyToOne(() => ConstructionStage)
  @JoinColumn({ name: 'stageId' })
  stage: ConstructionStage;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'int', default: 0 })
  days: number;

  @Column({ type: 'timestamp', nullable: true })
  remindTime: Date;

  @Column({ nullable: true })
  handler: string;

  @Column({
    type: 'enum',
    enum: DelayReminderStatus,
    default: DelayReminderStatus.PENDING,
  })
  status: DelayReminderStatus;

  @CreateDateColumn()
  createdAt: Date;
}
