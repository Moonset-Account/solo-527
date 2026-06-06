import { groupBy, uniqBy } from 'lodash-es';
import dayjs from 'dayjs';
import {
  LearningActivity,
  FilterState,
  FunnelNode,
  CorrectRateItem,
  CohortMetric,
  KPICardData,
  DropoutStudent,
  Student,
  Chapter,
  Cohort,
} from '../data/types';
import {
  ACTIVITY_TYPE_ORDER,
  ACTIVITY_TYPE_LABELS,
  DROPOUT_THRESHOLD,
  LOW_SAMPLE_THRESHOLD,
} from '../data/constants';
import { detectAnomalies } from './validator';

export const filterActivities = (
  activities: LearningActivity[],
  filters: FilterState
): LearningActivity[] => {
  return activities.filter((act) => {
    if (filters.courseIds.length > 0 && !filters.courseIds.includes(act.courseId)) {
      return false;
    }
    if (filters.chapterIds.length > 0 && !filters.chapterIds.includes(act.chapterId)) {
      return false;
    }
    if (filters.studentIds.length > 0 && !filters.studentIds.includes(act.studentId)) {
      return false;
    }
    if (filters.questionIds.length > 0 && act.questionId && !filters.questionIds.includes(act.questionId)) {
      return false;
    }
    if (act.firstCompletedAt) {
      const completedAt = dayjs(act.firstCompletedAt);
      if (completedAt.isBefore(filters.timeRange.start) || completedAt.isAfter(filters.timeRange.end)) {
        return false;
      }
    }
    return true;
  });
};

export const deduplicateFirstCompletion = (activities: LearningActivity[]): LearningActivity[] => {
  const grouped = groupBy(activities, (a) => `${a.studentId}-${a.activityType}-${a.chapterId}`);
  
  return Object.values(grouped).map((group) => {
    const completed = group.filter((a) => a.firstCompletedAt !== null);
    if (completed.length === 0) {
      return group[0];
    }
    return completed.sort((a, b) => 
      dayjs(a.firstCompletedAt!).valueOf() - dayjs(b.firstCompletedAt!).valueOf()
    )[0];
  });
};

export const filterByCohorts = (
  activities: LearningActivity[],
  cohortIds: string[],
  students: Student[]
): LearningActivity[] => {
  if (cohortIds.length === 0) return activities;
  
  const studentIdsInCohorts = students
    .filter((s) => cohortIds.includes(s.cohortId))
    .map((s) => s.id);
  
  return activities.filter((a) => studentIdsInCohorts.includes(a.studentId));
};

export const calculateFunnelData = (
  activities: LearningActivity[],
  students: Student[]
): { funnel: FunnelNode[]; totalStudents: number } => {
  const uniqueStudents = uniqBy(students, 'id');
  const totalStudents = uniqueStudents.length;
  
  const funnel: FunnelNode[] = [];
  let prevCount = totalStudents;
  
  ACTIVITY_TYPE_ORDER.forEach((activityType, index) => {
    const typeActivities = activities.filter(
      (a) => a.activityType === activityType && a.firstCompletedAt !== null
    );
    const completedStudents = uniqBy(typeActivities, 'studentId').length;
    
    const conversionRate = prevCount > 0 ? completedStudents / prevCount : 0;
    const dropoutRate = 1 - conversionRate;
    const isDropoutPoint = conversionRate < DROPOUT_THRESHOLD && index > 0;
    
    funnel.push({
      name: ACTIVITY_TYPE_LABELS[activityType],
      value: completedStudents,
      conversionRate,
      dropoutRate,
      isDropoutPoint,
      activityType,
    });
    
    prevCount = completedStudents;
  });
  
  return { funnel, totalStudents };
};

export const calculateCorrectRates = (
  activities: LearningActivity[],
  chapters: Chapter[],
  questionIds: string[] = []
): CorrectRateItem[] => {
  let quizActivities = activities.filter(
    (a) => a.activityType === 'quiz' && a.firstCompletedAt !== null
  );
  
  if (questionIds.length > 0) {
    quizActivities = quizActivities.filter(
      (a) => a.questionId && questionIds.includes(a.questionId)
    );
  }
  
  const relevantChapterIds = [...new Set(quizActivities.map((a) => a.chapterId))];
  const relevantChapters = relevantChapterIds.length > 0
    ? chapters.filter((ch) => relevantChapterIds.includes(ch.id))
    : chapters;
  
  const groupedByChapter = groupBy(quizActivities, 'chapterId');
  
  const rates: CorrectRateItem[] = relevantChapters.map((chapter) => {
    const chapterActivities = groupedByChapter[chapter.id] || [];
    const totalAttempts = chapterActivities.length;
    const correctCount = chapterActivities.filter((a) => a.isCorrect).length;
    const correctRate = totalAttempts > 0 ? correctCount / totalAttempts : 0;
    
    return {
      chapterId: chapter.id,
      chapterName: chapter.name,
      correctRate,
      totalAttempts,
      isAbnormal: false,
    };
  });
  
  const rateValues = rates.map((r) => r.correctRate);
  const { anomalies, threshold } = detectAnomalies(rateValues);
  
  return rates.map((r) => {
    const isAbnormal = anomalies.includes(r.correctRate);
    let abnormalReason: string | undefined;
    if (isAbnormal) {
      if (r.correctRate < threshold.lower) {
        abnormalReason = '正确率显著低于平均水平';
      } else if (r.correctRate > threshold.upper) {
        abnormalReason = '正确率显著高于平均水平';
      }
    }
    return { ...r, isAbnormal, abnormalReason };
  });
};

export const calculateCohortMetrics = (
  activities: LearningActivity[],
  cohorts: Cohort[],
  students: Student[]
): CohortMetric[] => {
  return cohorts.map((cohort) => {
    const cohortStudents = students.filter((s) => s.cohortId === cohort.id);
    const cohortStudentIds = cohortStudents.map((s) => s.id);
    const cohortActivities = activities.filter((a) => cohortStudentIds.includes(a.studentId));
    const sampleSize = cohortStudents.length;
    
    const calculateRate = (type: string): number => {
      const typeActivities = cohortActivities.filter(
        (a) => a.activityType === type && a.firstCompletedAt !== null
      );
      const completedStudents = uniqBy(typeActivities, 'studentId').length;
      return sampleSize > 0 ? completedStudents / sampleSize : 0;
    };
    
    const quizCorrectRate = (() => {
      const quizActivities = cohortActivities.filter(
        (a) => a.activityType === 'quiz' && a.firstCompletedAt !== null
      );
      const total = quizActivities.length;
      const correct = quizActivities.filter((a) => a.isCorrect).length;
      return total > 0 ? correct / total : 0;
    })();
    
    return {
      cohortId: cohort.id,
      cohortName: cohort.name,
      videoCompletionRate: calculateRate('video'),
      homeworkSubmissionRate: calculateRate('homework'),
      quizPassRate: quizCorrectRate,
      discussionParticipationRate: calculateRate('discussion'),
      certificateRate: calculateRate('certificate'),
      sampleSize,
    };
  });
};

export const calculateKPIs = (
  activities: LearningActivity[],
  students: Student[]
): KPICardData[] => {
  const totalStudents = students.length;
  const isLowSample = totalStudents < LOW_SAMPLE_THRESHOLD;
  
  const getCompletedCount = (type: string): number => {
    const typeActivities = activities.filter(
      (a) => a.activityType === type && a.firstCompletedAt !== null
    );
    return uniqBy(typeActivities, 'studentId').length;
  };
  
  const videoRate = totalStudents > 0 ? getCompletedCount('video') / totalStudents : 0;
  const homeworkRate = totalStudents > 0 ? getCompletedCount('homework') / totalStudents : 0;
  const certificateRate = totalStudents > 0 ? getCompletedCount('certificate') / totalStudents : 0;
  
  const quizActivities = activities.filter(
    (a) => a.activityType === 'quiz' && a.firstCompletedAt !== null
  );
  const avgScore = quizActivities.length > 0
    ? quizActivities.reduce((sum, a) => sum + (a.score || 0), 0) / quizActivities.length
    : 0;
  
  return [
    {
      title: '视频完成率',
      value: videoRate * 100,
      unit: '%',
      trend: 2.5,
      sampleSize: totalStudents,
      isLowSample,
    },
    {
      title: '作业提交率',
      value: homeworkRate * 100,
      unit: '%',
      trend: -1.2,
      sampleSize: totalStudents,
      isLowSample,
    },
    {
      title: '测验平均分',
      value: avgScore,
      unit: '分',
      trend: 3.8,
      sampleSize: quizActivities.length,
      isLowSample: quizActivities.length < LOW_SAMPLE_THRESHOLD,
    },
    {
      title: '证书获取率',
      value: certificateRate * 100,
      unit: '%',
      trend: 5.1,
      sampleSize: totalStudents,
      isLowSample,
    },
  ];
};

export const getDropoutStudents = (
  activities: LearningActivity[],
  students: Student[],
  activityType: string,
  cohorts: Cohort[]
): DropoutStudent[] => {
  const typeIndex = ACTIVITY_TYPE_ORDER.indexOf(activityType as any);
  if (typeIndex <= 0) return [];
  
  const prevType = ACTIVITY_TYPE_ORDER[typeIndex - 1];
  const prevActivities = activities.filter(
    (a) => a.activityType === prevType && a.firstCompletedAt !== null
  );
  const prevStudents = uniqBy(prevActivities, 'studentId').map((a) => a.studentId);
  
  const currentActivities = activities.filter(
    (a) => a.activityType === activityType && a.firstCompletedAt !== null
  );
  const currentStudents = uniqBy(currentActivities, 'studentId').map((a) => a.studentId);
  
  const dropoutStudentIds = prevStudents.filter((id) => !currentStudents.includes(id));
  
  return dropoutStudentIds.map((studentId) => {
    const student = students.find((s) => s.id === studentId)!;
    const cohort = cohorts.find((c) => c.id === student.cohortId)!;
    const studentActivities = activities.filter((a) => a.studentId === studentId);
    const lastActivity = studentActivities
      .filter((a) => a.firstCompletedAt)
      .sort((a, b) => dayjs(b.firstCompletedAt!).valueOf() - dayjs(a.firstCompletedAt!).valueOf())[0];
    
    return {
      studentId,
      studentName: student.name,
      cohortId: student.cohortId,
      cohortName: cohort?.name || '',
      lastActivityAt: lastActivity?.firstCompletedAt || null,
      isMakeup: student.isMakeup,
    };
  });
};
