import { format, addDays, subWeeks, startOfWeek } from 'date-fns';

export interface MockStudent {
  id: string;
  classId: string;
  studentId: string;
  fullName: string;
  gender: 'male' | 'female';
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  enrollmentDate: string;
  status: string;
  className: string;
  grade: string;
}

export interface MockAttendance {
  id: string;
  studentId: string;
  courseId: string;
  classId: string;
  date: string;
  weekNumber: number;
  status: string;
  isExcused: boolean;
  remarks?: string;
}

export interface MockAssignment {
  id: string;
  title: string;
  courseId: string;
  classId: string;
  type: string;
  weekNumber: number;
  maxScore: number;
}

export interface MockAssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  score: number | null;
  submittedAt: string | null;
  isLate: boolean;
  isMissing: boolean;
}

export interface MockQuiz {
  id: string;
  title: string;
  courseId: string;
  classId: string;
  type: string;
  weekNumber: number;
  date: string;
  maxScore: number;
  questionTypes: string[];
}

export interface MockQuizSubmission {
  id: string;
  quizId: string;
  studentId: string;
  totalScore: number | null;
  isMissing: boolean;
  submittedAt: string | null;
  questionScores: { questionType: string; score: number; maxScore: number }[];
}

export interface MockInteraction {
  id: string;
  studentId: string;
  courseId: string;
  classId: string;
  date: string;
  weekNumber: number;
  interactionType: string;
  qualityScore: number;
  duration: number;
}

export interface MockLeave {
  id: string;
  studentId: string;
  classId: string;
  leaveType: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface MockClass {
  id: string;
  name: string;
  grade: string;
  major: string;
  academicYear: string;
  semester: number;
  studentCount: number;
}

export interface MockCourse {
  id: string;
  courseCode: string;
  name: string;
  teacherName: string;
  teacherId: string;
  credits: number;
}

export interface MockTeacher {
  id: string;
  fullName: string;
  department: string;
  title: string;
}

const classNames = ['计算机科学与技术1班', '计算机科学与技术2班', '软件工程1班', '软件工程2班', '数据科学1班'];
const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡'];
const lastNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛'];
const courseNames = [
  { code: 'CS101', name: '程序设计基础', teacher: '李教授' },
  { code: 'CS201', name: '数据结构与算法', teacher: '王教授' },
  { code: 'CS301', name: '数据库系统', teacher: '张教授' },
  { code: 'CS401', name: '计算机网络', teacher: '刘教授' },
  { code: 'SE201', name: '软件工程', teacher: '陈教授' },
  { code: 'DS301', name: '机器学习', teacher: '赵教授' },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomScore(base: number, variance: number): number {
  return Math.max(0, Math.min(100, Math.round(base + (Math.random() - 0.5) * variance)));
}

export const mockTeachers: MockTeacher[] = [
  { id: 't1', fullName: '李教授', department: '计算机科学系', title: '教授' },
  { id: 't2', fullName: '王教授', department: '计算机科学系', title: '副教授' },
  { id: 't3', fullName: '张教授', department: '软件工程系', title: '教授' },
  { id: 't4', fullName: '刘教授', department: '计算机科学系', title: '讲师' },
  { id: 't5', fullName: '陈教授', department: '软件工程系', title: '副教授' },
  { id: 't6', fullName: '赵教授', department: '数据科学系', title: '教授' },
];

export const mockClasses: MockClass[] = classNames.map((name, idx) => ({
  id: `class-${idx + 1}`,
  name,
  grade: '2023级',
  major: idx < 2 ? '计算机科学与技术' : idx < 4 ? '软件工程' : '数据科学',
  academicYear: '2023-2024',
  semester: 2,
  studentCount: 45,
}));

export const mockCourses: MockCourse[] = courseNames.map((c, idx) => ({
  id: `course-${idx + 1}`,
  courseCode: c.code,
  name: c.name,
  teacherName: c.teacher,
  teacherId: `t${idx + 1}`,
  credits: randomInRange(2, 4),
}));

export function generateStudents(count = 45, classId = 'class-1', className = '计算机科学与技术1班'): MockStudent[] {
  const students: MockStudent[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let fullName: string;
    do {
      fullName = pickRandom(firstNames) + pickRandom(lastNames);
    } while (usedNames.has(fullName));
    usedNames.add(fullName);

    const baseLat = 39.9 + Math.random() * 0.1;
    const baseLng = 116.3 + Math.random() * 0.15;

    students.push({
      id: `student-${classId}-${i + 1}`,
      classId,
      studentId: `2023${String(i + 1).padStart(6, '0')}`,
      fullName,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      phone: `138${String(randomInRange(10000000, 99999999))}`,
      email: `student${i + 1}@university.edu.cn`,
      latitude: baseLat,
      longitude: baseLng,
      enrollmentDate: '2023-09-01',
      status: 'active',
      className,
      grade: '2023级',
    });
  }

  return students;
}

export function generateAttendanceData(students: MockStudent[], courses: MockCourse[], weeks = 16): MockAttendance[] {
  const attendance: MockAttendance[] = [];
  const startDate = startOfWeek(subWeeks(new Date(), 4));

  students.forEach((student) => {
    const absenceChance = 0.05 + Math.random() * 0.1;
    const lateChance = 0.08 + Math.random() * 0.1;

    for (let week = 1; week <= weeks; week++) {
      courses.forEach((course) => {
        const date = format(addDays(startDate, (week - 1) * 7 + randomInRange(0, 4)), 'yyyy-MM-dd');
        const rand = Math.random();
        let status = 'present';
        let isExcused = false;
        let remarks: string | undefined;

        if (rand < absenceChance * 0.3) {
          status = 'absent';
          remarks = pickRandom(['未请假缺勤', '无故缺席', '']);
        } else if (rand < absenceChance) {
          status = 'excused';
          isExcused = true;
          remarks = pickRandom(['病假', '事假', '公假']);
        } else if (rand < absenceChance + lateChance) {
          status = 'late';
          remarks = pickRandom(['迟到5分钟', '迟到10分钟', '']);
        }

        attendance.push({
          id: `att-${generateId()}`,
          studentId: student.id,
          courseId: course.id,
          classId: student.classId,
          date,
          weekNumber: week,
          status,
          isExcused,
          remarks,
        });
      });
    }
  });

  return attendance;
}

export function generateAssignments(courses: MockCourse[], classId: string): MockAssignment[] {
  const assignments: MockAssignment[] = [];
  const types = ['homework', 'project', 'lab', 'essay'];

  courses.forEach((course, cIdx) => {
    for (let i = 1; i <= 6; i++) {
      assignments.push({
        id: `assign-${course.id}-${i}`,
        title: `第${i}次${pickRandom(['作业', '实验', '项目'])}`,
        courseId: course.id,
        classId,
        type: pickRandom(types),
        weekNumber: i * 2 + randomInRange(-1, 1),
        maxScore: i === 3 ? 100 : randomInRange(80, 100),
      });
    }
  });

  return assignments;
}

export function generateAssignmentSubmissions(
  assignments: MockAssignment[],
  students: MockStudent[]
): MockAssignmentSubmission[] {
  const submissions: MockAssignmentSubmission[] = [];

  students.forEach((student, sIdx) => {
    const basePerformance = 60 + (sIdx / students.length) * 35;

    assignments.forEach((assignment) => {
      const missingChance = 0.05 + Math.random() * 0.1;
      const lateChance = 0.1 + Math.random() * 0.15;

      const isMissing = Math.random() < missingChance;
      const isLate = !isMissing && Math.random() < lateChance;

      submissions.push({
        id: `sub-${generateId()}`,
        assignmentId: assignment.id,
        studentId: student.id,
        score: isMissing ? null : randomScore(basePerformance, 25),
        submittedAt: isMissing ? null : `2024-03-${String(assignment.weekNumber * 2 + 10).padStart(2, '0')}`,
        isLate,
        isMissing,
      });
    });
  });

  return submissions;
}

export function generateQuizzes(courses: MockCourse[], classId: string): MockQuiz[] {
  const quizzes: MockQuiz[] = [];
  const types = ['daily', 'weekly', 'monthly', 'midterm', 'final'];
  const questionTypes = ['single_choice', 'multiple_choice', 'true_false', 'short_answer', 'essay'];

  courses.forEach((course) => {
    for (let i = 1; i <= 4; i++) {
      const selectedQTypes = [
        pickRandom(questionTypes),
        pickRandom(questionTypes),
        pickRandom(questionTypes),
      ].filter((v, i, a) => a.indexOf(v) === i);

      quizzes.push({
        id: `quiz-${course.id}-${i}`,
        title: i === 4 ? '期中考试' : `第${i}次测验`,
        courseId: course.id,
        classId,
        type: i === 4 ? 'midterm' : pickRandom(types.slice(0, 3)),
        weekNumber: i * 3,
        date: `2024-0${i + 1}-${String(randomInRange(10, 25)).padStart(2, '0')}`,
        maxScore: i === 4 ? 100 : randomInRange(50, 100),
        questionTypes: selectedQTypes,
      });
    }
  });

  return quizzes;
}

export function generateQuizSubmissions(
  quizzes: MockQuiz[],
  students: MockStudent[]
): MockQuizSubmission[] {
  const submissions: MockQuizSubmission[] = [];

  students.forEach((student, sIdx) => {
    const basePerformance = 55 + (sIdx / students.length) * 40;

    quizzes.forEach((quiz) => {
      const missingChance = 0.03 + Math.random() * 0.07;
      const isMissing = Math.random() < missingChance;

      const questionScores = quiz.questionTypes.map((qt) => {
        const maxScore = qt === 'essay' ? 30 : qt === 'short_answer' ? 20 : 10;
        return {
          questionType: qt,
          score: isMissing ? 0 : Math.round(randomScore(basePerformance, 25) * maxScore / 100),
          maxScore,
        };
      });

      const totalScore = questionScores.reduce((sum, q) => sum + q.score, 0);

      submissions.push({
        id: `quiz-sub-${generateId()}`,
        quizId: quiz.id,
        studentId: student.id,
        totalScore: isMissing ? null : totalScore,
        isMissing,
        submittedAt: isMissing ? null : quiz.date,
        questionScores,
      });
    });
  });

  return submissions;
}

export function generateInteractions(
  students: MockStudent[],
  courses: MockCourse[],
  weeks = 16
): MockInteraction[] {
  const interactions: MockInteraction[] = [];
  const types = ['question', 'answer', 'discussion', 'presentation', 'group_work'];

  students.forEach((student, sIdx) => {
    const participationRate = 0.2 + (sIdx / students.length) * 0.6;

    for (let week = 1; week <= weeks; week++) {
      courses.forEach((course) => {
        if (Math.random() < participationRate) {
          const count = randomInRange(1, 3);
          for (let i = 0; i < count; i++) {
            interactions.push({
              id: `inter-${generateId()}`,
              studentId: student.id,
              courseId: course.id,
              classId: student.classId,
              date: format(addDays(startOfWeek(subWeeks(new Date(), 4)), (week - 1) * 7 + randomInRange(0, 4)), 'yyyy-MM-dd'),
              weekNumber: week,
              interactionType: pickRandom(types),
              qualityScore: randomInRange(3, 10) / 2,
              duration: randomInRange(1, 15),
            });
          }
        }
      });
    }
  });

  return interactions;
}

export function generateLeaves(students: MockStudent[]): MockLeave[] {
  const leaves: MockLeave[] = [];
  const types = ['sick', 'personal', 'official', 'other'];
  const reasons = {
    sick: ['感冒发烧', '急性肠胃炎', '头痛', '牙痛', '过敏反应'],
    personal: ['家庭事务', '个人原因', '外出办事', '参加活动'],
    official: ['参加竞赛', '实习答辩', '学校活动', '外出参会'],
    other: ['其他原因'],
  };

  students.forEach((student) => {
    if (Math.random() < 0.4) {
      const type = pickRandom(types) as keyof typeof reasons;
      const startOffset = randomInRange(-60, 0);
      const duration = randomInRange(1, 5);

      leaves.push({
        id: `leave-${generateId()}`,
        studentId: student.id,
        classId: student.classId,
        leaveType: type,
        reason: pickRandom(reasons[type]),
        startDate: format(addDays(new Date(), startOffset), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), startOffset + duration - 1), 'yyyy-MM-dd'),
        status: pickRandom(['approved', 'approved', 'approved', 'pending']),
      });
    }
  });

  return leaves;
}

export interface MockDataset {
  students: MockStudent[];
  classes: MockClass[];
  courses: MockCourse[];
  teachers: MockTeacher[];
  attendance: MockAttendance[];
  assignments: MockAssignment[];
  assignmentSubmissions: MockAssignmentSubmission[];
  quizzes: MockQuiz[];
  quizSubmissions: MockQuizSubmission[];
  interactions: MockInteraction[];
  leaves: MockLeave[];
  updateTime: string;
}

export function generateMockDataset(classId = 'class-1', className = '计算机科学与技术1班'): MockDataset {
  const students = generateStudents(45, classId, className);
  const classCourses = mockCourses.slice(0, 4);
  const assignments = generateAssignments(classCourses, classId);
  const quizzes = generateQuizzes(classCourses, classId);

  return {
    students,
    classes: mockClasses,
    courses: classCourses,
    teachers: mockTeachers,
    attendance: generateAttendanceData(students, classCourses),
    assignments,
    assignmentSubmissions: generateAssignmentSubmissions(assignments, students),
    quizzes,
    quizSubmissions: generateQuizSubmissions(quizzes, students),
    interactions: generateInteractions(students, classCourses),
    leaves: generateLeaves(students),
    updateTime: new Date().toISOString(),
  };
}

export const mockDataset = generateMockDataset();
