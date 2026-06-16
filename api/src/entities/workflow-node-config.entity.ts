import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('workflow_node_configs')
export class WorkflowNodeConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'workflow_type', length: 50 })
  workflowType: string;

  @Column({
    name: 'node_type',
    type: 'enum',
    enum: ['start', 'end', 'approve', 'notify', 'condition'],
  })
  nodeType: 'start' | 'end' | 'approve' | 'notify' | 'condition';

  @Column({ name: 'node_key', length: 50 })
  nodeKey: string;

  @Column({ name: 'config', type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ name: 'order_num', type: 'int', default: 0 })
  orderNum: number;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
