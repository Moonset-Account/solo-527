import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Project } from '../project/project.entity';

@Entity('house_surveys')
export class HouseSurvey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'date', nullable: true })
  surveyDate: string;

  @Column({ nullable: true })
  surveyor: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  area: number;

  @Column({ nullable: true })
  layout: string;

  @Column({ type: 'int', nullable: true })
  floor: number;

  @Column({ nullable: true })
  orientation: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  photos: string[];

  @Column({ nullable: true })
  handler: string;

  @Column({ type: 'timestamp', nullable: true })
  handleTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
