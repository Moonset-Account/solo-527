import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('workflow_node_configs')
export class WorkflowNodeConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'process_type', length: 30 })
  processType: 'contract' | 'settlement' | 'appointment';

  @Column({ name: 'node_name', length: 200 })
  nodeName: string;

  @Column({ name: 'node_order', type: 'int', default: 0 })
  nodeOrder: number;

  @Column({ name: 'approver_role', length: 50, nullable: true })
  approverRole: string;

  @Column({ name: 'is_required', type: 'boolean', default: true })
  isRequired: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
