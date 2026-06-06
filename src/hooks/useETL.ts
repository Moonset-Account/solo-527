import { useMemo } from 'react';
import { useFilterStore } from '../stores/filterStore';
import {
  getActivities,
  getCourses,
  getChapters,
  getCohorts,
  getStudents,
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
  
  const processedData = useMemo(() => {
    let activities = filterActivities(allActivities, filters);
    activities = filterByCohorts(activities, filters.cohortIds, allStudents);
    activities = deduplicateFirstCompletion(activities);
    
    let students = allStudents;
    if (filters.cohortIds.length > 0) {
      students = students.filter((s) => filters.cohortIds.includes(s.cohortId));
    }
    if (filters.studentIds.length > 0) {
      students = students.filter((s) => filters.studentIds.includes(s.id));
    }
    
    const validation = validateData(activities);
    const { funnel, totalStudents } = calculateFunnelData(activities, students);
    const correctRates = calculateCorrectRates(activities, chapters);
    const cohortMetrics = calculateCohortMetrics(activities, cohorts, allStudents);
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
      allStudents,
      activityType,
      cohorts
    );
  };
  
  return {
    courses,
    chapters,
    cohorts,
    students: processedData.students,
    activities: processedData.activities,
    validation: processedData.validation as ValidationResult,
    funnel: processedData.funnel as FunnelNode[],
    totalStudents: processedData.totalStudents as number,
    correctRates: processedData.correctRates as CorrectRateItem[],
    cohortMetrics: processedData.cohortMetrics as CohortMetric[],
    kpis: processedData.kpis as KPICardData[],
    getDropoutStudentsByType,
  };
};
