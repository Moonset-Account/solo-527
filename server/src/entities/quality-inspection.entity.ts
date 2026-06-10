import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';

export type InspectionResult = 'passed' | 'failed' | 'partial' | 'pending';

@Entity('quality_inspections')
export class QualityInspection extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'node_id', type: 'uuid', nullable: true })
  nodeId: string;

  @Column({ type: 'varchar', length: 100, name: 'inspection_type' })
  inspectionType: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'inspection_item' })
  inspectionItem: string;

  @Column({ type: 'int', name: 'inspected_quantity' })
  inspectedQuantity: number;

  @Column({ type: 'int', default: 0, name: 'passed_quantity' })
  passedQuantity: number;

  @Column({ type: 'int', default: 0, name: 'failed_quantity' })
  failedQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'pass_rate' })
  passRate: number;

  @Column({
    type: 'enum',
    enum: ['passed', 'failed', 'partial', 'pending'],
    default: 'pending',
  })
  result: InspectionResult;

  @Column({ type: 'text', nullable: true, name: 'defect_description' })
  defectDescription: string;

  @Column({ type: 'text', nullable: true, name: 'handling_suggestion' })
  handlingSuggestion: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'inspector' })
  inspector: string;

  @Column({ type: 'timestamp', nullable: true, name: 'inspection_time' })
  inspectionTime: Date;

  @Column({ type: 'simple-json', nullable: true, name: 'inspection_data' })
  inspectionData: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_fields' })
  extraFields: Record<string, any>;

  @ManyToOne(() => Order, order => order.qualityInspections)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
