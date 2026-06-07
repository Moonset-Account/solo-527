export const DATA_DICTIONARY = {
  attendanceStatus: {
    present: { label: '出勤', value: 'present', color: '#10b981' },
    absent: { label: '缺勤', value: 'absent', color: '#ef4444' },
    late: { label: '迟到', value: 'late', color: '#f59e0b' },
    early: { label: '早退', value: 'early', color: '#f59e0b' },
    excused: { label: '请假', value: 'excused', color: '#6366f1' },
  },
  leaveType: {
    sick: { label: '病假', value: 'sick', color: '#ef4444' },
    personal: { label: '事假', value: 'personal', color: '#f59e0b' },
    official: { label: '公假', value: 'official', color: '#3b82f6' },
    other: { label: '其他', value: 'other', color: '#6b7280' },
  },
  leaveStatus: {
    pending: { label: '待审批', value: 'pending', color: '#f59e0b' },
    approved: { label: '已批准', value: 'approved', color: '#10b981' },
    rejected: { label: '已拒绝', value: 'rejected', color: '#ef4444' },
  },
  assignmentType: {
    homework: { label: '课后作业', value: 'homework' },
    project: { label: '项目作业', value: 'project' },
    lab: { label: '实验报告', value: 'lab' },
    essay: { label: '论文', value: 'essay' },
    other: { label: '其他', value: 'other' },
  },
  quizType: {
    daily: { label: '随堂测验', value: 'daily' },
    weekly: { label: '周测', value: 'weekly' },
    monthly: { label: '月考', value: 'monthly' },
    midterm: { label: '期中考试', value: 'midterm' },
    final: { label: '期末考试', value: 'final' },
  },
  questionType: {
    single_choice: { label: '单选题', value: 'single_choice' },
    multiple_choice: { label: '多选题', value: 'multiple_choice' },
    true_false: { label: '判断题', value: 'true_false' },
    short_answer: { label: '简答题', value: 'short_answer' },
    essay: { label: '论述题', value: 'essay' },
  },
  interactionType: {
    question: { label: '提问', value: 'question' },
    answer: { label: '回答', value: 'answer' },
    discussion: { label: '讨论', value: 'discussion' },
    presentation: { label: '展示', value: 'presentation' },
    group_work: { label: '小组合作', value: 'group_work' },
  },
  studentStatus: {
    active: { label: '在读', value: 'active' },
    suspended: { label: '休学', value: 'suspended' },
    graduated: { label: '毕业', value: 'graduated' },
    dropped: { label: '退学', value: 'dropped' },
  },
  userRole: {
    admin: { label: '系统管理员', value: 'admin' },
    dean: { label: '教务主任', value: 'dean' },
    teacher: { label: '任课教师', value: 'teacher' },
    head_teacher: { label: '班主任', value: 'head_teacher' },
  },
} as const;

export type AttendanceStatus = keyof typeof DATA_DICTIONARY.attendanceStatus;
export type LeaveType = keyof typeof DATA_DICTIONARY.leaveType;
export type AssignmentType = keyof typeof DATA_DICTIONARY.assignmentType;
export type QuizType = keyof typeof DATA_DICTIONARY.quizType;
export type QuestionType = keyof typeof DATA_DICTIONARY.questionType;
export type InteractionType = keyof typeof DATA_DICTIONARY.interactionType;

export function getDictionaryLabel(
  category: keyof typeof DATA_DICTIONARY,
  key: string
): string {
  const categoryDict = DATA_DICTIONARY[category];
  if (!categoryDict) return key;
  const entry = (categoryDict as Record<string, { label: string }>)[key];
  return entry?.label || key;
}

export function getDictionaryColor(
  category: keyof typeof DATA_DICTIONARY,
  key: string
): string {
  const categoryDict = DATA_DICTIONARY[category];
  if (!categoryDict) return '#6b7280';
  const entry = (categoryDict as Record<string, { color?: string }>)[key];
  return entry?.color || '#6b7280';
}
