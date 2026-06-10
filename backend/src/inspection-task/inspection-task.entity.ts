import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Project } from '../project/project.entity';
import { ConstructionStage } from '../construction-stage/construction-stage.entity';
import { InspectionResult } from '../common/enums/inspection-result.enum';
import { InspectionStatus } from '../common/enums/inspection-status.enum';

@Entity('inspection_tasks')
export class InspectionTask {
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

  @Column()
  title: string;

  @Column({ type: 'date', nullable: true })
  planDate: string;

  @Column({ nullable: true })
  inspector: string;

  @Column({ type: 'date', nullable: true })
  actualDate: string;

  @Column({
    type: 'enum',
    enum: InspectionResult,
    nullable: true,
  })
  result: InspectionResult;

  @Column({ type: 'text', nullable: true })
  issues: string;

  @Column({ type: 'date', nullable: true })
  rectificationDeadline: string;

  @Column({
    type: 'enum',
    enum: InspectionStatus,
    default: InspectionStatus.PENDING,
  })
  status: InspectionStatus;

  @Column({ nullable: true })
  handler: string;

  @Column({ type: 'timestamp', nullable: true })
  handleTime: Date;

  @CreateDateColumn()
  createdAt: Date;
}
