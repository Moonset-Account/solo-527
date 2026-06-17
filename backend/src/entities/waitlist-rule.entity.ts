import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Counselor } from './counselor.entity';

export type RuleType = 'time_window' | 'capacity' | 'priority';

@Entity('waitlist_rules')
export class WaitlistRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ruleName: string;

  @Column({
    type: 'enum',
    enum: ['time_window', 'capacity', 'priority'],
  })
  ruleType: RuleType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 30 })
  notificationWindowMinutes: number;

  @Column({ type: 'int', default: 15 })
  responseTimeoutMinutes: number;

  @Column({ type: 'int', default: 10 })
  maxQueueSize: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @ManyToOne(() => Counselor, { nullable: true, onDelete: 'CASCADE' })
  counselor: Counselor;

  @Column({ nullable: true })
  counselorId: string;

  @Column({ type: 'text', nullable: true })
  conditions: string;

  @Column({ type: 'text', nullable: true })
  actions: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
