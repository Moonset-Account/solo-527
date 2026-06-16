import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Contract } from './contract.entity.js';
import { SettlementRule } from './settlement-rule.entity.js';
import { User } from './user.entity.js';

@Entity('settlements')
export class Settlement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'contract_id', type: 'int' })
  contractId: number;

  @Column({ name: 'rule_id', type: 'int', nullable: true })
  ruleId: number;

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    name: 'type',
    type: 'enum',
    enum: ['rent', 'deposit', 'utility', 'damage', 'other'],
  })
  type: 'rent' | 'deposit' | 'utility' | 'damage' | 'other';

  @Column({ name: 'period_start', type: 'date' })
  periodStart: string;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['pending', 'approved', 'paid', 'cancelled'],
    default: 'pending',
  })
  status: 'pending' | 'approved' | 'paid' | 'cancelled';

  @Column({ name: 'approved_by', type: 'int', nullable: true })
  approvedBy: number;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @ManyToOne(() => SettlementRule)
  @JoinColumn({ name: 'rule_id' })
  rule: SettlementRule;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver: User;
}
