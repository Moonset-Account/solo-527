import { useMemo } from 'react';
import { useFilterStore } from '../stores/filterStore';
import {
  getActivities,
  getCourses,
  getChapters,
  getCohorts,
  getStudents,
  getQuestions,
} from '../data/mock';
import {
  filterActivities,
  deduplicateFirstCompletion,
  filterByCohorts,
  calculateFunnelData,
  calculateCorrectRates,
  calculateCohortMetrics,
  calculateKPIs,
  getDropoutStudents,
} from '../utils/etl';
import { validateData } from '../utils/validator';
import { ActivityType, FunnelNode, CorrectRateItem, CohortMetric, KPICardData, DropoutStudent, ValidationResult } from '../data/types';

export const useETL = () => {
  const filters = useFilterStore();
  
  const courses = useMemo(() => getCourses(), []);
  const chapters = useMemo(() => getChapters(), []);
  const cohorts = useMemo(() => getCohorts(), []);
  const allStudents = useMemo(() => getStudents(), []);
  const allActivities = useMemo(() => getActivities(), []);
  const allQuestions = useMemo(() => getQuestions(), []);
  
  const processedData = useMemo(() => {
    let activities = filterActivities(allActivities, filters);
    activities = filterByCohorts(activities, filters.cohortIds, allStudents);
    
    let students = allStudents;
    if (filters.cohortIds.length > 0) {
      students = students.filter((s) => filters.cohortIds.includes(s.cohortId));
    }
    if (filters.studentIds.length > 0) {
      students = students.filter((s) => filters.studentIds.includes(s.id));
    }
    
    if (filters.questionIds.length > 0) {
      const quizActivitiesWithQuestions = activities.filter(
        (a) => a.activityType === 'quiz' && a.questionId && filters.questionIds.includes(a.questionId)
      );
      const studentIdsWithSelectedQuestions = [...new Set(quizActivitiesWithQuestions.map((a) => a.studentId))];
      activities = activities.filter((a) => studentIdsWithSelectedQuestions.includes(a.studentId));
      students = students.filter((s) => studentIdsWithSelectedQuestions.includes(s.id));
    }
    
    activities = deduplicateFirstCompletion(activities);
    
    const filteredCohorts = filters.cohortIds.length > 0
      ? cohorts.filter((c) => filters.cohortIds.includes(c.id))
      : cohorts;
    
    const validation = validateData(activities);
    const { funnel, totalStudents } = calculateFunnelData(activities, students);
    const correctRates = calculateCorrectRates(activities, chapters, filters.questionIds);
    const cohortMetrics = calculateCohortMetrics(activities, filteredCohorts, students);
    const kpis = calculateKPIs(activities, students);
    
    return {
      activities,
      students,
      validation,
      funnel,
      totalStudents,
      correctRates,
      cohortMetrics,
      kpis,
    };
  }, [filters, allActivities, allStudents, chapters, cohorts]);
  
  const getDropoutStudentsByType = (activityType: ActivityType): DropoutStudent[] => {
    return getDropoutStudents(
      processedData.activities,
      processedData.students,
      activityType,
      cohorts
    );
  };
  
  const questions = useMemo(() => {
    let qs = allQuestions;
    if (filters.courseIds.length > 0) {
      const filteredChapterIds = chapters
        .filter((ch) => filters.courseIds.includes(ch.courseId))
        .map((ch) => ch.id);
      qs = qs.filter((q) => filteredChapterIds.includes(q.chapterId));
    }
    if (filters.chapterIds.length > 0) {
      qs = qs.filter((q) => filters.chapterIds.includes(q.chapterId));
    }
    return qs;
  }, [allQuestions, filters.courseIds, filters.chapterIds, chapters]);

  return {
    courses,
    chapters,
    cohorts,
    students: processedData.students,
    activities: processedData.activities,
    questions,
    allQuestions,
    validation: processedData.validation as ValidationResult,
    funnel: processedData.funnel as FunnelNode[],
    totalStudents: processedData.totalStudents as number,
    correctRates: processedData.correctRates as CorrectRateItem[],
    cohortMetrics: processedData.cohortMetrics as CohortMetric[],
    kpis: processedData.kpis as KPICardData[],
    getDropoutStudentsByType,
  };
};
