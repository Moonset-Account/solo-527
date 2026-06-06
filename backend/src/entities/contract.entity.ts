import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Quote } from './quote.entity';
import { ApprovalLog } from './approval-log.entity';

export type ContractStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'signed';

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Quote, quote => quote.contract)
  @JoinColumn({ name: 'quote_id' })
  quote: Quote;

  @Column({ name: 'quote_id', nullable: true })
  quoteId: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: ContractStatus;

  @Column({ name: 'signed_file_url', nullable: true, length: 500 })
  signedFileUrl: string;

  @OneToMany(() => ApprovalLog, log => log.contract, { cascade: true })
  approvalLogs: ApprovalLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
