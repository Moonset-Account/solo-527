import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Settlement } from './settlement.entity.js';
import { Contract } from './contract.entity.js';

@Entity('payment_records')
export class PaymentRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'settlement_id', type: 'int', nullable: true })
  settlementId: number;

  @Column({ name: 'contract_id', type: 'int', nullable: true })
  contractId: number;

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'payment_method', length: 50 })
  paymentMethod: string;

  @Column({ name: 'payment_channel', length: 50, nullable: true })
  paymentChannel: string;

  @Column({ name: 'transaction_id', length: 100, nullable: true })
  transactionId: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['pending', 'processing', 'success', 'failed', 'refunded'],
    default: 'pending',
  })
  status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded';

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Settlement)
  @JoinColumn({ name: 'settlement_id' })
  settlement: Settlement;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;
}
