import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('recruitment_cycles')
export class RecruitmentCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ default: 'active' })
  status: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('simple-json', { nullable: true })
  milestones: { name: string; date: Date; description: string }[];

  @Column({ default: 0 })
  resumeCount: number;

  @Column({ default: 0 })
  hireCount: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('processing_records')
export class ProcessingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  resumeId: string;

  @Column()
  candidateName: string;

  @Column()
  actionType: string;

  @Column('text', { nullable: true })
  actionDetail: string;

  @Column()
  operatorId: string;

  @Column()
  operatorName: string;

  @Column('text', { nullable: true })
  remarks: string;

  @Column('simple-json', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
