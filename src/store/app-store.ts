import { create } from 'zustand'
import type {
  Question,
  ScoringStandard,
  Assessment,
  Interviewer,
  InstructorAvailability,
  Interview,
  HiringResult,
  SystemConfig,
  ConfigChangeLog,
  ReminderRule,
  Alert,
  ExportReport,
  Submission,
} from '@/types/database'
import {
  mockQuestions,
  mockScoringStandards,
  mockAssessments,
  mockInterviewers,
  mockInstructorAvailability,
  mockInterviews,
  mockHiringResults,
  mockSystemConfigs,
  mockConfigChangeLogs,
  mockReminderRules,
  mockAlerts,
  mockExportReports,
  mockSubmissions,
} from '@/lib/mock-data'

interface AppState {
  questions: Question[]
  scoringStandards: ScoringStandard[]
  assessments: Assessment[]
  interviewers: Interviewer[]
  instructorAvailability: InstructorAvailability[]
  interviews: Interview[]
  hiringResults: HiringResult[]
  systemConfigs: SystemConfig[]
  configChangeLogs: ConfigChangeLog[]
  reminderRules: ReminderRule[]
  alerts: Alert[]
  exportReports: ExportReport[]
  submissions: Submission[]
  initialized: boolean

  addQuestion: (question: Question) => void
  updateQuestion: (id: string, data: Partial<Question>) => void
  deleteQuestion: (id: string) => void

  addScoringStandard: (standard: ScoringStandard) => void
  updateScoringStandard: (id: string, data: Partial<ScoringStandard>) => void
  deleteScoringStandard: (id: string) => void

  addAssessment: (assessment: Assessment) => void
  updateAssessment: (id: string, data: Partial<Assessment>) => void
  deleteAssessment: (id: string) => void

  addInterviewer: (interviewer: Interviewer) => void
  updateInterviewer: (id: string, data: Partial<Interviewer>) => void
  deleteInterviewer: (id: string) => void

  addInstructorAvailability: (availability: InstructorAvailability) => void
  updateInstructorAvailability: (id: string, data: Partial<InstructorAvailability>) => void
  deleteInstructorAvailability: (id: string) => void

  addInterview: (interview: Interview) => void
  updateInterview: (id: string, data: Partial<Interview>) => void
  deleteInterview: (id: string) => void

  addHiringResult: (result: HiringResult) => void
  updateHiringResult: (id: string, data: Partial<HiringResult>) => void
  deleteHiringResult: (id: string) => void

  addSystemConfig: (config: SystemConfig) => void
  updateSystemConfig: (id: string, data: Partial<SystemConfig>) => void
  deleteSystemConfig: (id: string) => void

  addConfigChangeLog: (log: ConfigChangeLog) => void

  addReminderRule: (rule: ReminderRule) => void
  updateReminderRule: (id: string, data: Partial<ReminderRule>) => void
  deleteReminderRule: (id: string) => void

  addAlert: (alert: Alert) => void
  updateAlert: (id: string, data: Partial<Alert>) => void
  removeAlert: (id: string) => void

  addExportReport: (report: ExportReport) => void
  deleteExportReport: (id: string) => void

  addSubmission: (submission: Submission) => void
  updateSubmission: (id: string, data: Partial<Submission>) => void
  deleteSubmission: (id: string) => void

  initializeFromMock: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  questions: [],
  scoringStandards: [],
  assessments: [],
  interviewers: [],
  instructorAvailability: [],
  interviews: [],
  hiringResults: [],
  systemConfigs: [],
  configChangeLogs: [],
  reminderRules: [],
  alerts: [],
  exportReports: [],
  submissions: [],
  initialized: false,

  addQuestion: (question) => set((s) => ({ questions: [...s.questions, question] })),
  updateQuestion: (id, data) =>
    set((s) => ({ questions: s.questions.map((q) => (q.id === id ? { ...q, ...data } : q)) })),
  deleteQuestion: (id) => set((s) => ({ questions: s.questions.filter((q) => q.id !== id) })),

  addScoringStandard: (standard) => set((s) => ({ scoringStandards: [...s.scoringStandards, standard] })),
  updateScoringStandard: (id, data) =>
    set((s) => ({ scoringStandards: s.scoringStandards.map((st) => (st.id === id ? { ...st, ...data } : st)) })),
  deleteScoringStandard: (id) =>
    set((s) => ({ scoringStandards: s.scoringStandards.filter((st) => st.id !== id) })),

  addAssessment: (assessment) => set((s) => ({ assessments: [...s.assessments, assessment] })),
  updateAssessment: (id, data) =>
    set((s) => ({ assessments: s.assessments.map((a) => (a.id === id ? { ...a, ...data } : a)) })),
  deleteAssessment: (id) => set((s) => ({ assessments: s.assessments.filter((a) => a.id !== id) })),

  addInterviewer: (interviewer) => set((s) => ({ interviewers: [...s.interviewers, interviewer] })),
  updateInterviewer: (id, data) =>
    set((s) => ({ interviewers: s.interviewers.map((i) => (i.id === id ? { ...i, ...data } : i)) })),
  deleteInterviewer: (id) => set((s) => ({ interviewers: s.interviewers.filter((i) => i.id !== id) })),

  addInstructorAvailability: (availability) =>
    set((s) => ({ instructorAvailability: [...s.instructorAvailability, availability] })),
  updateInstructorAvailability: (id, data) =>
    set((s) => ({
      instructorAvailability: s.instructorAvailability.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),
  deleteInstructorAvailability: (id) =>
    set((s) => ({ instructorAvailability: s.instructorAvailability.filter((a) => a.id !== id) })),

  addInterview: (interview) => set((s) => ({ interviews: [...s.interviews, interview] })),
  updateInterview: (id, data) =>
    set((s) => ({ interviews: s.interviews.map((i) => (i.id === id ? { ...i, ...data } : i)) })),
  deleteInterview: (id) => set((s) => ({ interviews: s.interviews.filter((i) => i.id !== id) })),

  addHiringResult: (result) => set((s) => ({ hiringResults: [...s.hiringResults, result] })),
  updateHiringResult: (id, data) =>
    set((s) => ({ hiringResults: s.hiringResults.map((r) => (r.id === id ? { ...r, ...data } : r)) })),
  deleteHiringResult: (id) => set((s) => ({ hiringResults: s.hiringResults.filter((r) => r.id !== id) })),

  addSystemConfig: (config) => set((s) => ({ systemConfigs: [...s.systemConfigs, config] })),
  updateSystemConfig: (id, data) =>
    set((s) => ({ systemConfigs: s.systemConfigs.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
  deleteSystemConfig: (id) => set((s) => ({ systemConfigs: s.systemConfigs.filter((c) => c.id !== id) })),

  addConfigChangeLog: (log) => set((s) => ({ configChangeLogs: [...s.configChangeLogs, log] })),

  addReminderRule: (rule) => set((s) => ({ reminderRules: [...s.reminderRules, rule] })),
  updateReminderRule: (id, data) =>
    set((s) => ({ reminderRules: s.reminderRules.map((r) => (r.id === id ? { ...r, ...data } : r)) })),
  deleteReminderRule: (id) => set((s) => ({ reminderRules: s.reminderRules.filter((r) => r.id !== id) })),

  addAlert: (alert) => set((s) => ({ alerts: [...s.alerts, alert] })),
  updateAlert: (id, data) =>
    set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, ...data } : a)) })),
  removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

  addExportReport: (report) => set((s) => ({ exportReports: [...s.exportReports, report] })),
  deleteExportReport: (id) => set((s) => ({ exportReports: s.exportReports.filter((r) => r.id !== id) })),

  addSubmission: (submission) => set((s) => ({ submissions: [...s.submissions, submission] })),
  updateSubmission: (id, data) =>
    set((s) => ({ submissions: s.submissions.map((sub) => (sub.id === id ? { ...sub, ...data } : sub)) })),
  deleteSubmission: (id) => set((s) => ({ submissions: s.submissions.filter((sub) => sub.id !== id) })),

  initializeFromMock: () => {
    if (get().initialized) return
    set({
      questions: mockQuestions,
      scoringStandards: mockScoringStandards,
      assessments: mockAssessments,
      interviewers: mockInterviewers,
      instructorAvailability: mockInstructorAvailability,
      interviews: mockInterviews,
      hiringResults: mockHiringResults,
      systemConfigs: mockSystemConfigs,
      configChangeLogs: mockConfigChangeLogs,
      reminderRules: mockReminderRules,
      alerts: mockAlerts,
      exportReports: mockExportReports,
      submissions: mockSubmissions,
      initialized: true,
    })
  },
}))
