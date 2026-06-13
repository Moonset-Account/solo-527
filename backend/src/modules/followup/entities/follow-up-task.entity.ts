import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { Clinic } from '../../clinic/entities/clinic.entity';
import { User } from '../../user/entities/user.entity';
import { ReminderTask } from '../../reminder/entities/reminder-task.entity';

@Entity('follow_up_tasks')
export class FollowUpTask extends BaseEntity {
  @Column({ name: 'appointment_id', nullable: false })
  appointmentId: string;

  @ManyToOne(() => Appointment, appointment => appointment.followUpTasks)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ name: 'patient_id', nullable: false })
  patientId: string;

  @ManyToOne(() => Patient, patient => patient.followUpTasks)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'doctor_id', nullable: false })
  doctorId: string;

  @ManyToOne(() => Doctor, doctor => doctor.followUpTasks)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'clinic_id', nullable: false })
  clinicId: string;

  @ManyToOne(() => Clinic, clinic => clinic.followUpTasks)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ name: 'type', length: 30, nullable: false })
  type: string;

  @Column({ name: 'content', type: 'text', nullable: false })
  content: string;

  @Column({ name: 'plan_date', type: 'date', nullable: false })
  planDate: Date;

  @Column({ name: 'status', length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'actual_date', type: 'date', nullable: true })
  actualDate: Date;

  @Column({ name: 'result', type: 'text', nullable: true })
  result: string;

  @Column({ name: 'feedback', type: 'text', nullable: true })
  feedback: string;

  @Column({ name: 'reminder_task_id', nullable: true })
  reminderTaskId: string;

  @OneToOne(() => ReminderTask, reminderTask => reminderTask.followUpTask)
  @JoinColumn({ name: 'reminder_task_id' })
  reminderTask: ReminderTask;

  @Column({ name: 'created_by', nullable: false })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
