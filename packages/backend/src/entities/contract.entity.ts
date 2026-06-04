import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Quote } from './quote.entity';
import { User } from './user.entity';

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SIGNED = 'signed',
  CANCELLED = 'cancelled',
}

@Entity('contracts')
export class Contract extends BaseEntity {
  @Column({ unique: true })
  contractNumber: string;

  @Column()
  quoteId: string;

  @OneToOne(() => Quote, quote => quote.contract)
  @JoinColumn({ name: 'quoteId' })
  quote: Quote;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.DRAFT,
  })
  status: ContractStatus;

  @Column()
  customerName: string;

  @Column({ type: 'text', nullable: true })
  customerSignature: string;

  @Column({ type: 'timestamp', nullable: true })
  customerSignedAt: Date;

  @Column({ nullable: true })
  companySignatoryId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'companySignatoryId' })
  companySignatory: User;

  @Column({ type: 'timestamp', nullable: true })
  companySignedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  paymentTerms: {
    stage: string;
    percentage: number;
    amount: number;
    dueDate?: Date;
    paid: boolean;
    paidAt?: Date;
  }[];

  @Column({ type: 'text', nullable: true })
  termsAndConditions: string;

  @Column({ nullable: true })
  approvedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  approvalComments: string;

  @Column({ type: 'text', nullable: true })
  specialClauses: string;
}
