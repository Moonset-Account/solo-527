import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('interviews')
export class Interview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  resumeId: string;

  @Column()
  candidateName: string;

  @Column()
  position: string;

  @Column({ nullable: true })
  interviewerId: string;

  @Column({ nullable: true })
  interviewerName: string;

  @Column({ type: 'datetime', nullable: true })
  scheduledTime: Date;

  @Column({ nullable: true })
  durationMinutes: number;

  @Column({ default: 'pending' })
  status: string;

  @Column('text', { nullable: true })
  location: string;

  @Column('text', { nullable: true })
  meetingLink: string;

  @Column('text', { nullable: true })
  interviewType: string;

  @Column('int', { nullable: true })
  round: number;

  @Column('text', { nullable: true })
  feedback: string;

  @Column('int', { nullable: true })
  score: number;

  @Column('text', { nullable: true })
  abilityAssessment: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('interviewer_schedules')
export class InterviewerSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  interviewerId: string;

  @Column()
  interviewerName: string;

  @Column({ type: 'date' })
  date: Date;

  @Column('simple-json')
  timeSlots: { start: string; end: string; available: boolean; interviewId?: string }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
