import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('settlement_rules')
export class SettlementRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'type', length: 50 })
  type: string;

  @Column({ name: 'amount', type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'calculation_method', length: 50, nullable: true })
  calculationMethod: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'status', type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status: 'active' | 'inactive';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
