import { Entity, Column, ManyToOne, ManyToMany, JoinTable, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Clinic } from '../../clinic/entities/clinic.entity';
import { Role } from './role.entity';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { OperationLog } from '../../log/entities/operation-log.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ name: 'username', length: 50, unique: true, nullable: false })
  username: string;

  @Column({ name: 'password_hash', length: 255, nullable: false })
  passwordHash: string;

  @Column({ name: 'real_name', length: 50, nullable: false })
  realName: string;

  @Column({ name: 'phone', length: 20, nullable: true })
  phone: string;

  @Column({ name: 'email', length: 100, nullable: true })
  email: string;

  @Column({ name: 'clinic_id', nullable: true })
  clinicId: string;

  @ManyToOne(() => Clinic, clinic => clinic.users)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @ManyToMany(() => Role, role => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  roles: Role[];

  @OneToOne(() => Doctor, doctor => doctor.user)
  doctor: Doctor;

  @OneToMany(() => Appointment, appointment => appointment.createdBy)
  createdAppointments: Appointment[];

  @OneToMany(() => OperationLog, log => log.user)
  operationLogs: OperationLog[];
}
