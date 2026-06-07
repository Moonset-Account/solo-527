import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  boolean,
  date,
  jsonb,
  uuid,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatar: varchar('avatar', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
  })
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id').references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  })
);

export const classes = pgTable('classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  grade: varchar('grade', { length: 20 }),
  major: varchar('major', { length: 100 }),
  academicYear: varchar('academic_year', { length: 20 }),
  semester: integer('semester'),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const teachers = pgTable('teachers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  employeeId: varchar('employee_id', { length: 50 }).unique(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  department: varchar('department', { length: 100 }),
  title: varchar('title', { length: 50 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'set null' }),
  studentId: varchar('student_id', { length: 50 }).unique(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  gender: varchar('gender', { length: 10 }),
  birthDate: date('birth_date'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  address: text('address'),
  latitude: numeric('latitude', { precision: 10, scale: 6 }),
  longitude: numeric('longitude', { precision: 10, scale: 6 }),
  enrollmentDate: date('enrollment_date'),
  status: varchar('status', { length: 20 }).default('active'),
  avatar: varchar('avatar', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  classIdx: index('students_class_idx').on(table.classId),
}));

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseCode: varchar('course_code', { length: 50 }).unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  credits: numeric('credits', { precision: 3, scale: 1 }),
  totalHours: integer('total_hours'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const courseClasses = pgTable(
  'course_classes',
  {
    courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
    classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }),
    teacherId: uuid('teacher_id').references(() => teachers.id, { onDelete: 'set null' }),
    academicYear: varchar('academic_year', { length: 20 }),
    semester: integer('semester'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.courseId, table.classId, table.academicYear, table.semester] }),
  })
);

export const attendance = pgTable('attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  weekNumber: integer('week_number'),
  sessionNumber: integer('session_number'),
  status: varchar('status', { length: 20 }).notNull(),
  checkInTime: timestamp('check_in_time'),
  checkOutTime: timestamp('check_out_time'),
  remarks: text('remarks'),
  isExcused: boolean('is_excused').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  studentDateIdx: index('attendance_student_date_idx').on(table.studentId, table.date),
  classDateIdx: index('attendance_class_date_idx').on(table.classId, table.date),
}));

export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }),
  leaveType: varchar('leave_type', { length: 50 }).notNull(),
  reason: text('reason').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  totalDays: numeric('total_days', { precision: 4, scale: 1 }),
  status: varchar('status', { length: 20 }).default('pending'),
  approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const assignments = pgTable('assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }),
  teacherId: uuid('teacher_id').references(() => teachers.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }),
  weekNumber: integer('week_number'),
  dueDate: timestamp('due_date'),
  maxScore: numeric('max_score', { precision: 5, scale: 2 }).default('100'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const assignmentSubmissions = pgTable('assignment_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  assignmentId: uuid('assignment_id').references(() => assignments.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  submittedAt: timestamp('submitted_at'),
  score: numeric('score', { precision: 5, scale: 2 }),
  weekNumber: integer('week_number'),
  feedback: text('feedback'),
  isLate: boolean('is_late').default(false),
  isMissing: boolean('is_missing').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  assignmentStudentIdx: index('submission_assignment_student_idx').on(table.assignmentId, table.studentId),
}));

export const quizzes = pgTable('quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }),
  teacherId: uuid('teacher_id').references(() => teachers.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }),
  weekNumber: integer('week_number'),
  date: date('date'),
  duration: integer('duration'),
  maxScore: numeric('max_score', { precision: 5, scale: 2 }).default('100'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const quizQuestions = pgTable('quiz_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }),
  questionType: varchar('question_type', { length: 50 }).notNull(),
  content: text('content').notNull(),
  options: jsonb('options'),
  correctAnswer: text('correct_answer'),
  maxScore: numeric('max_score', { precision: 5, scale: 2 }).default('10'),
  orderIndex: integer('order_index'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const quizSubmissions = pgTable('quiz_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at'),
  submittedAt: timestamp('submitted_at'),
  totalScore: numeric('total_score', { precision: 5, scale: 2 }),
  weekNumber: integer('week_number'),
  isMissing: boolean('is_missing').default(false),
  answers: jsonb('answers'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  quizStudentIdx: index('quiz_submission_quiz_student_idx').on(table.quizId, table.studentId),
}));

export const quizQuestionScores = pgTable('quiz_question_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').references(() => quizSubmissions.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').references(() => quizQuestions.id, { onDelete: 'cascade' }),
  score: numeric('score', { precision: 5, scale: 2 }),
  answer: text('answer'),
  isCorrect: boolean('is_correct'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const classInteractions = pgTable('class_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
  teacherId: uuid('teacher_id').references(() => teachers.id, { onDelete: 'set null' }),
  date: date('date').notNull(),
  weekNumber: integer('week_number'),
  interactionType: varchar('interaction_type', { length: 50 }).notNull(),
  content: text('content'),
  duration: integer('duration'),
  qualityScore: numeric('quality_score', { precision: 3, scale: 1 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  studentDateIdx: index('interaction_student_date_idx').on(table.studentId, table.date),
}));

export const classPermissions = pgTable(
  'class_permissions',
  {
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }),
    canView: boolean('can_view').default(true),
    canEdit: boolean('can_edit').default(false),
    canExport: boolean('can_export').default(false),
    canViewContact: boolean('can_view_contact').default(false),
    grantedAt: timestamp('granted_at').defaultNow(),
    grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.classId] }),
  })
);

export const dataDictionary = pgTable('data_dictionary', {
  id: serial('id').primaryKey(),
  category: varchar('category', { length: 50 }).notNull(),
  key: varchar('key', { length: 100 }).notNull(),
  value: varchar('value', { length: 200 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const importLogs = pgTable('import_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  importType: varchar('import_type', { length: 50 }).notNull(),
  fileName: varchar('file_name', { length: 255 }),
  totalRecords: integer('total_records').default(0),
  successfulRecords: integer('successful_records').default(0),
  failedRecords: integer('failed_records').default(0),
  errors: jsonb('errors'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const dataUpdateLogs = pgTable('data_update_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: uuid('record_id'),
  operation: varchar('operation', { length: 20 }).notNull(),
  changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizSubmission = typeof quizSubmissions.$inferSelect;
export type ClassInteraction = typeof classInteractions.$inferSelect;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
