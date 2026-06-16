import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from './room.entity.js';
import { User } from './user.entity.js';
import { ContractTemplate } from './contract-template.entity.js';

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'room_id', type: 'int' })
  roomId: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId: number;

  @Column({ name: 'owner_id', type: 'int' })
  ownerId: number;

  @Column({ name: 'template_id', type: 'int', nullable: true })
  templateId: number;

  @Column({ name: 'contract_number', length: 50, unique: true })
  contractNumber: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'rent_amount', type: 'decimal', precision: 10, scale: 2 })
  rentAmount: number;

  @Column({ name: 'deposit_amount', type: 'decimal', precision: 10, scale: 2 })
  depositAmount: number;

  @Column({ name: 'payment_cycle', type: 'int', default: 1 })
  paymentCycle: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['draft', 'owner_signed', 'tenant_signed', 'active', 'expired', 'terminated', 'archived'],
    default: 'draft',
  })
  status: 'draft' | 'owner_signed' | 'tenant_signed' | 'active' | 'expired' | 'terminated' | 'archived';

  @Column({ name: 'signed_at', type: 'timestamp', nullable: true })
  signedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Room, (room) => room.contracts)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tenant_id' })
  tenant: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => ContractTemplate)
  @JoinColumn({ name: 'template_id' })
  template: ContractTemplate;
}
