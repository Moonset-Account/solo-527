import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_templates')
export class ContractTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 200 })
  name: string;

  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({ name: 'fields', type: 'jsonb', default: '[]' })
  fields: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
