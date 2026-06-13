import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '../project/project.entity.js';
import { Customer } from '../common/customer.entity.js';

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ length: 50 })
  stage: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ name: 'quality_rating', type: 'int', nullable: true })
  qualityRating: number;

  @Column({ name: 'service_rating', type: 'int', nullable: true })
  serviceRating: number;

  @Column({ name: 'schedule_rating', type: 'int', nullable: true })
  scheduleRating: number;

  @Column({ name: 'communication_rating', type: 'int', nullable: true })
  communicationRating: number;

  @Column({ name: 'cost_rating', type: 'int', nullable: true })
  costRating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'text', nullable: true })
  suggestion: string;

  @Column({ name: 'would_recommend', type: 'boolean', nullable: true })
  wouldRecommend: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  getAverageRating(): number {
    const ratings = [
      this.qualityRating,
      this.serviceRating,
      this.scheduleRating,
      this.communicationRating,
      this.costRating,
    ].filter(r => r !== null && r !== undefined) as number[];

    if (ratings.length === 0) return this.rating;
    return Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10;
  }
}
