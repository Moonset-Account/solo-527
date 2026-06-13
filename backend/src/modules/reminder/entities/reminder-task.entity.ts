import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { Clinic } from '../../clinic/entities/clinic.entity';
import { User } from '../../user/entities/user.entity';
import { FollowUpTask } from '../../followup/entities/follow-up-task.entity';

@Entity('reminder_tasks')
export class ReminderTask extends BaseEntity {
  @Column({ name: 'type', length: 30, nullable: false })
  type: string;

  @Column({ name: 'related_id', nullable: false })
  relatedId: string;

  @Column({ name: 'patient_id', nullable: false })
  patientId: string;

  @ManyToOne(() => Patient, patient => patient.reminderTasks)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'clinic_id', nullable: false })
  clinicId: string;

  @ManyToOne(() => Clinic, clinic => clinic.reminderTasks)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ name: 'title', length: 200, nullable: false })
  title: string;

  @Column({ name: 'content', type: 'text', nullable: true })
  content: string;

  @Column({ name: 'priority', length: 20, default: 'normal' })
  priority: string;

  @Column({ name: 'status', length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'assigned_to', nullable: true })
  assignedToId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User;

  @Column({ name: 'completed_by', nullable: true })
  completedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'completed_by' })
  completedBy: User;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ name: 'remind_count', default: 0 })
  remindCount: number;

  @Column({ name: 'last_remind_at', type: 'timestamp', nullable: true })
  lastRemindAt: Date;

  @Column({ name: 'result', type: 'text', nullable: true })
  result: string;

  @Column({ name: 'created_by', nullable: false })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @OneToOne(() => FollowUpTask, followUp => followUp.reminderTask)
  followUpTask: FollowUpTask;
}
