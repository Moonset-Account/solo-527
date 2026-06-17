import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Appointment } from './appointment.entity';
import { WaitlistEntry } from './waitlist-entry.entity';
import { Refund } from './refund.entity';

export type UserRole = 'client' | 'counselor' | 'dispatcher' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({
    type: 'enum',
    enum: ['client', 'counselor', 'dispatcher', 'admin'],
    default: 'client',
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @OneToMany(() => Appointment, (appointment) => appointment.client)
  appointments: Appointment[];

  @OneToMany(() => WaitlistEntry, (waitlistEntry) => waitlistEntry.client)
  waitlistEntries: WaitlistEntry[];

  @OneToMany(() => Refund, (refund) => refund.client)
  refunds: Refund[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
