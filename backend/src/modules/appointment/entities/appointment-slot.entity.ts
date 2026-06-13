import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { Clinic } from '../../clinic/entities/clinic.entity';
import { Appointment } from './appointment.entity';

@Entity('appointment_slots')
export class AppointmentSlot extends BaseEntity {
  @Column({ name: 'doctor_id', nullable: false })
  doctorId: string;

  @ManyToOne(() => Doctor, doctor => doctor.slots)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'clinic_id', nullable: false })
  clinicId: string;

  @ManyToOne(() => Clinic, clinic => clinic.slots)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ name: 'date', type: 'date', nullable: false })
  date: Date;

  @Column({ name: 'start_time', type: 'time', nullable: false })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', nullable: false })
  endTime: string;

  @Column({ name: 'max_patients', default: 1 })
  maxPatients: number;

  @Column({ name: 'booked_count', default: 0 })
  bookedCount: number;

  @Column({ name: 'status', length: 20, default: 'available' })
  status: string;

  @OneToMany(() => Appointment, appointment => appointment.slot)
  appointments: Appointment[];
}
