import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

export type ResumeStatus = 
  | 'submitted' 
  | 'screening' 
  | 'written_test' 
  | 'interview' 
  | 'offer' 
  | 'rejected' 
  | 'hired';

@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  candidateId: string;

  @Column()
  candidateName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  school: string;

  @Column({ nullable: true })
  major: string;

  @Column({ nullable: true })
  degree: string;

  @Column({ nullable: true })
  graduationYear: number;

  @Column('text', { nullable: true })
  skills: string;

  @Column('text', { nullable: true })
  experience: string;

  @Column('text', { nullable: true })
  projects: string;

  @Column({ nullable: true })
  positionApplied: string;

  @Column({
    type: 'text',
    default: 'submitted'
  })
  status: ResumeStatus;

  @Column({ default: 0 })
  overallScore: number;

  @Column('text', { nullable: true })
  abilityProfile: string;

  @Column({ nullable: true })
  assignedHrId: string;

  @Column({ nullable: true })
  recruiterCycle: string;

  @Column('text', { nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('resume_status_logs')
export class ResumeStatusLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  resumeId: string;

  @Column({
    type: 'text'
  })
  fromStatus: ResumeStatus;

  @Column({
    type: 'text'
  })
  toStatus: ResumeStatus;

  @Column()
  operatorId: string;

  @Column()
  operatorName: string;

  @Column('text', { nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
