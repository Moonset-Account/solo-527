import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefundRuleType } from '../../common/enums/refund-rule-type.enum';

@Entity('packages')
export class Package {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({ type: 'int', default: 0 })
  sessionCount: number;

  @Column({
    type: 'enum',
    enum: RefundRuleType,
    default: RefundRuleType.PARTIAL_REFUND,
  })
  refundRuleType: RefundRuleType;

  @Column({ type: 'int', nullable: true })
  refundDeadlineHours: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  refundPercentage: number;

  @Column({ type: 'text', nullable: true })
  refundNotes: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
