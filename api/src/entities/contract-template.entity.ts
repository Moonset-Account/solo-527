import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contract_templates')
export class ContractTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({ name: 'version', length: 20 })
  version: string;

  @Column({ name: 'status', type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status: 'active' | 'inactive';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
