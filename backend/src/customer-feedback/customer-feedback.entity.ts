import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Project } from '../project/project.entity';
import { FeedbackType } from '../common/enums/feedback-type.enum';
import { FeedbackStatus } from '../common/enums/feedback-status.enum';

@Entity('customer_feedbacks')
export class CustomerFeedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: FeedbackType,
  })
  type: FeedbackType;

  @Column({ type: 'timestamp', nullable: true })
  feedbackTime: Date;

  @Column({ nullable: true })
  handler: string;

  @Column({ type: 'text', nullable: true })
  reply: string;

  @Column({ type: 'timestamp', nullable: true })
  replyTime: Date;

  @Column({
    type: 'enum',
    enum: FeedbackStatus,
    default: FeedbackStatus.PENDING,
  })
  status: FeedbackStatus;

  @CreateDateColumn()
  createdAt: Date;
}
