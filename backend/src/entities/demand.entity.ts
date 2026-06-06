import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Quote } from './quote.entity';

export type DemandStatus = 'pending' | 'quoting' | 'quoted' | 'confirmed' | 'cancelled';

@Entity('demands')
export class Demand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_name', length: 100 })
  customerName: string;

  @Column({ name: 'customer_phone', length: 20 })
  customerPhone: string;

  @Column({ name: 'customer_email', nullable: true, length: 100 })
  customerEmail: string;

  @Column({ name: 'travel_start', type: 'date' })
  travelStart: Date;

  @Column({ name: 'travel_end', type: 'date' })
  travelEnd: Date;

  @Column({ type: 'int' })
  days: number;

  @Column({ name: 'people_count', type: 'int' })
  peopleCount: number;

  @Column({ name: 'adult_count', type: 'int', default: 0 })
  adultCount: number;

  @Column({ name: 'child_count', type: 'int', default: 0 })
  childCount: number;

  @Column({ type: 'text', nullable: true })
  destinations: string;

  @Column({ name: 'special_requirements', type: 'text', nullable: true })
  specialRequirements: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: DemandStatus;

  @ManyToOne(() => User, user => user.assignedDemands, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string;

  @OneToMany(() => Quote, quote => quote.demand)
  quotes: Quote[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
