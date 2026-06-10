import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Project } from '../project/project.entity';
import { ConstructionStageStatus } from '../common/enums/construction-stage-status.enum';

@Entity('construction_stages')
export class ConstructionStage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  name: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column({ type: 'date', nullable: true })
  actualStartDate: string;

  @Column({ type: 'date', nullable: true })
  actualEndDate: string;

  @Column({
    type: 'enum',
    enum: ConstructionStageStatus,
    default: ConstructionStageStatus.PENDING,
  })
  status: ConstructionStageStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  handler: string;

  @Column({ type: 'timestamp', nullable: true })
  handleTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
