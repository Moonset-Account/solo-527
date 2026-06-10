import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Project } from '../project/project.entity';
import { DesignPlanStatus } from '../common/enums/design-plan-status.enum';

@Entity('design_plans')
export class DesignPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  designFile: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  estimatedPrice: number;

  @Column({ nullable: true })
  handler: string;

  @Column({ type: 'timestamp', nullable: true })
  handleTime: Date;

  @Column({
    type: 'enum',
    enum: DesignPlanStatus,
    default: DesignPlanStatus.DRAFT,
  })
  status: DesignPlanStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
