import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  resumeId: string;

  @Column()
  candidateName: string;

  @Column({ nullable: true })
  questionBankId: string;

  @Column({ nullable: true })
  questionBankName: string;

  @Column({ default: 'pending' })
  status: string;

  @Column('int', { nullable: true })
  totalScore: number;

  @Column('int', { nullable: true })
  earnedScore: number;

  @Column('simple-json', { nullable: true })
  answers: { questionId: string; answer: string; score: number; gradedBy?: string }[];

  @Column('simple-json', { nullable: true })
  abilityScores: { ability: string; score: number; maxScore: number }[];

  @Column('text', { nullable: true })
  overallFeedback: string;

  @Column({ nullable: true })
  gradedById: string;

  @Column({ nullable: true })
  gradedByName: string;

  @Column({ type: 'datetime', nullable: true })
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  submittedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  gradedAt: Date;

  @Column({ default: false })
  hasDispute: boolean;

  @Column('text', { nullable: true })
  disputeReason: string;

  @Column({ default: false })
  isDisputeResolved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('scoring_criteria')
export class ScoringCriterion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column('int', { default: 100 })
  maxScore: number;

  @Column('int', { default: 60 })
  passScore: number;

  @Column('simple-json')
  dimensions: {
    name: string;
    weight: number;
    description: string;
    scoringGuide: string;
  }[];

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
