import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('settlement_rules')
export class SettlementRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 200 })
  name: string;

  @Column({ name: 'project_type', length: 100, nullable: true })
  projectType: string;

  @Column({
    name: 'cycle',
    type: 'varchar',
    length: 20,
    default: 'monthly',
  })
  cycle: 'monthly' | 'quarterly' | 'yearly';

  @Column({ name: 'ratio', type: 'decimal', precision: 5, scale: 4, default: 1.0 })
  ratio: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
