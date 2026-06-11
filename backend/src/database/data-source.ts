import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Resume, ResumeStatusLog } from '../entities/Resume';
import { Question, QuestionBank } from '../entities/Question';
import { Assessment, ScoringCriterion } from '../entities/Assessment';
import { Interview, InterviewerSchedule } from '../entities/Interview';
import { Notification, EscalationRule, NotificationTask } from '../entities/Notification';
import { RecruitmentCycle, ProcessingRecord } from '../entities/Recruitment';
import path from 'path';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '../../data/campus_recruitment.db'),
  entities: [
    User,
    Resume,
    ResumeStatusLog,
    Question,
    QuestionBank,
    Assessment,
    ScoringCriterion,
    Interview,
    InterviewerSchedule,
    Notification,
    EscalationRule,
    NotificationTask,
    RecruitmentCycle,
    ProcessingRecord,
  ],
  synchronize: true,
  logging: false,
});

export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}
