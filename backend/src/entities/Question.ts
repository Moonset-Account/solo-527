import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer' | 'coding' | 'essay';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'text'
  })
  type: QuestionType;

  @Column()
  category: string;

  @Column({
    type: 'text'
  })
  difficulty: DifficultyLevel;

  @Column('text')
  content: string;

  @Column('simple-json', { nullable: true })
  options: string[] | null;

  @Column('text', { nullable: true })
  correctAnswer: string;

  @Column('int', { default: 10 })
  defaultScore: number;

  @Column('text', { nullable: true })
  scoringCriteria: string;

  @Column('text', { nullable: true })
  knowledgePoints: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('question_banks')
export class QuestionBank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  category: string;

  @Column('simple-array', { nullable: true })
  questionIds: string[];

  @Column({ default: 0 })
  totalScore: number;

  @Column({ default: 60 })
  passScore: number;

  @Column({ default: 60 })
  durationMinutes: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
