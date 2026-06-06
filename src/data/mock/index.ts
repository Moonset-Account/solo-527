import dayjs from 'dayjs';
import { Course, Chapter, Cohort, Student, Question, LearningActivity } from '../types';

const COURSES: Course[] = [
  { id: 'course-1', name: 'React 高级开发实战', description: '深入学习 React 高级特性' },
  { id: 'course-2', name: 'TypeScript 从入门到精通', description: '系统学习 TypeScript' },
  { id: 'course-3', name: '前端工程化最佳实践', description: '掌握现代前端工程化' },
];

const CHAPTERS: Chapter[] = [
  { id: 'chap-1-1', courseId: 'course-1', name: 'React Hooks 深入理解', order: 1 },
  { id: 'chap-1-2', courseId: 'course-1', name: '状态管理方案对比', order: 2 },
  { id: 'chap-1-3', courseId: 'course-1', name: '性能优化实战', order: 3 },
  { id: 'chap-1-4', courseId: 'course-1', name: '组件设计模式', order: 4 },
  { id: 'chap-2-1', courseId: 'course-2', name: 'TypeScript 基础类型', order: 1 },
  { id: 'chap-2-2', courseId: 'course-2', name: '泛型与高级类型', order: 2 },
  { id: 'chap-2-3', courseId: 'course-2', name: '类型体操实战', order: 3 },
  { id: 'chap-3-1', courseId: 'course-3', name: '构建工具详解', order: 1 },
  { id: 'chap-3-2', courseId: 'course-3', name: 'CI/CD 流程搭建', order: 2 },
  { id: 'chap-3-3', courseId: 'course-3', name: '代码规范与质量', order: 3 },
];

const COHORTS: Cohort[] = [
  { id: 'cohort-2024-spring', name: '2024春期班', startDate: '2024-03-01', endDate: '2024-06-30' },
  { id: 'cohort-2024-summer', name: '2024夏期班', startDate: '2024-07-01', endDate: '2024-10-31' },
  { id: 'cohort-2024-autumn', name: '2024秋期班', startDate: '2024-09-01', endDate: '2024-12-31' },
  { id: 'cohort-2025-spring', name: '2025春期班', startDate: '2025-03-01', endDate: '2025-06-30' },
];

const generateStudents = (): Student[] => {
  const students: Student[] = [];
  const names = ['张伟', '李娜', '王强', '刘洋', '陈明', '杨丽', '赵磊', '黄芳', '周杰', '吴敏',
    '徐涛', '孙艳', '胡军', '朱婷', '郭鹏', '何欣', '高峰', '林琳', '罗勇', '梁颖',
    '宋晨', '唐悦', '许航', '韩雪', '冯博', '邓辉', '曹莹', '彭飞', '曾丽', '萧峰'];
  
  COHORTS.forEach((cohort, cohortIdx) => {
    const studentCount = 25 + Math.floor(Math.random() * 25);
    for (let i = 0; i < studentCount; i++) {
      const idx = (cohortIdx * 10 + i) % names.length;
      const isMakeup = Math.random() < 0.15;
      students.push({
        id: `student-${cohort.id}-${i + 1}`,
        name: `${names[idx]}${i + 1}`,
        cohortId: cohort.id,
        isMakeup,
        enrollDate: dayjs(cohort.startDate).add(Math.floor(Math.random() * 7), 'day').format('YYYY-MM-DD'),
      });
    }
  });
  return students;
};

const generateQuestions = (): Question[] => {
  const questions: Question[] = [];
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  
  CHAPTERS.forEach((chapter) => {
    const questionCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < questionCount; i++) {
      questions.push({
        id: `q-${chapter.id}-${i + 1}`,
        chapterId: chapter.id,
        title: `${chapter.name} - 题目${i + 1}`,
        difficulty: difficulties[Math.floor(Math.random() * 3)],
      });
    }
  });
  return questions;
};

const generateLearningActivities = (students: Student[], questions: Question[]): LearningActivity[] => {
  const activities: LearningActivity[] = [];
  const activityTypes: ('video' | 'homework' | 'quiz' | 'discussion' | 'certificate')[] = [
    'video', 'homework', 'quiz', 'discussion', 'certificate'
  ];
  
  const completionRates: Record<string, number> = {
    video: 0.95,
    homework: 0.80,
    quiz: 0.65,
    discussion: 0.45,
    certificate: 0.35,
  };

  students.forEach((student) => {
    CHAPTERS.forEach((chapter) => {
      activityTypes.forEach((activityType) => {
        const baseRate = completionRates[activityType];
        const cohortFactor = student.cohortId.includes('2025') ? 1.1 : 
                            student.cohortId.includes('autumn') ? 0.95 : 1;
        const makeupFactor = student.isMakeup ? 0.7 : 1;
        const chapterFactor = 1 - (chapter.order - 1) * 0.05;
        const finalRate = Math.min(0.98, baseRate * cohortFactor * makeupFactor * chapterFactor);
        
        const isCompleted = Math.random() < finalRate;
        const completedDate = isCompleted 
          ? dayjs(student.enrollDate).add(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm:ss')
          : null;
        
        let questionId: string | undefined;
        let score: number | undefined;
        let isCorrect: boolean | undefined;
        
        if (activityType === 'quiz') {
          const chapterQuestions = questions.filter(q => q.chapterId === chapter.id);
          if (chapterQuestions.length > 0) {
            const q = chapterQuestions[Math.floor(Math.random() * chapterQuestions.length)];
            questionId = q.id;
            if (isCompleted) {
              const correctRate = q.difficulty === 'easy' ? 0.85 : 
                                q.difficulty === 'medium' ? 0.65 : 0.4;
              isCorrect = Math.random() < correctRate;
              score = isCorrect ? 100 : Math.floor(Math.random() * 60);
            }
          }
        }
        
        activities.push({
          id: `act-${student.id}-${chapter.id}-${activityType}`,
          studentId: student.id,
          courseId: chapter.courseId,
          chapterId: chapter.id,
          activityType,
          questionId,
          completedAt: completedDate,
          firstCompletedAt: completedDate,
          score,
          isCorrect,
        });
      });
    });
  });
  
  return activities;
};

export const STUDENTS = generateStudents();
export const QUESTIONS = generateQuestions();
export const LEARNING_ACTIVITIES = generateLearningActivities(STUDENTS, QUESTIONS);

export const getCourses = (): Course[] => COURSES;
export const getChapters = (courseId?: string): Chapter[] => 
  courseId ? CHAPTERS.filter(c => c.courseId === courseId) : CHAPTERS;
export const getCohorts = (): Cohort[] => COHORTS;
export const getStudents = (cohortId?: string): Student[] => 
  cohortId ? STUDENTS.filter(s => s.cohortId === cohortId) : STUDENTS;
export const getQuestions = (chapterId?: string): Question[] => 
  chapterId ? QUESTIONS.filter(q => q.chapterId === chapterId) : QUESTIONS;
export const getActivities = (): LearningActivity[] => LEARNING_ACTIVITIES;
