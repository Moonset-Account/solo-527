import { mean, median, boxPlotStats, frequency, count } from '../utils/statistics';
import { detectMissingValues, detectOutliers } from '../utils/data-quality';
import {
  MockDataset,
  MockStudent,
  MockAttendance,
  MockAssignmentSubmission,
  MockQuizSubmission,
  MockInteraction,
  MockLeave,
} from '../mock/data';
import { DATA_DICTIONARY } from '../constants/data-dictionary';

export interface FilterParams {
  classId?: string;
  courseId?: string;
  studentIds?: string[];
  weekStart?: number;
  weekEnd?: number;
  teacherId?: string;
  questionType?: string;
}

export interface StudentMetrics {
  studentId: string;
  studentName: string;
  studentIdNumber: string;
  attendanceRate: number;
  absentCount: number;
  lateCount: number;
  assignmentAvgScore: number;
  assignmentSubmissionRate: number;
  quizAvgScore: number;
  interactionCount: number;
  interactionQuality: number;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RadarChartData {
  indicators: { name: string; max: number }[];
  series: { name: string; value: number[] }[];
}

export interface BoxPlotData {
  category: string;
  values: number[];
  stats: ReturnType<typeof boxPlotStats>;
  outliers: number[];
}

export interface TrendDataPoint {
  week: number;
  value: number;
  label: string;
}

export interface LeaveReasonStat {
  type: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DataQualityInfo {
  totalStudents: number;
  totalRecords: {
    attendance: number;
    assignments: number;
    quizzes: number;
    interactions: number;
  };
  missingRate: {
    attendance: number;
    assignments: number;
    quizzes: number;
  };
  outlierCount: {
    scores: number;
    attendance: number;
  };
  sampleSize: number;
  updateTime: string;
  filters: FilterParams;
}

export class AnalyticsService {
  private dataset: MockDataset;

  constructor(dataset: MockDataset) {
    this.dataset = dataset;
  }

  filterData(filters: FilterParams): {
    students: MockStudent[];
    attendance: MockAttendance[];
    assignmentSubmissions: MockAssignmentSubmission[];
    quizSubmissions: MockQuizSubmission[];
    interactions: MockInteraction[];
    leaves: MockLeave[];
  } {
    let students = this.dataset.students;
    let attendance = this.dataset.attendance;
    let assignmentSubmissions = this.dataset.assignmentSubmissions;
    let quizSubmissions = this.dataset.quizSubmissions;
    let interactions = this.dataset.interactions;
    let leaves = this.dataset.leaves;

    if (filters.classId) {
      students = students.filter((s) => s.classId === filters.classId);
      const studentIds = new Set(students.map((s) => s.id));
      attendance = attendance.filter((a) => studentIds.has(a.studentId));
      assignmentSubmissions = assignmentSubmissions.filter((s) => studentIds.has(s.studentId));
      quizSubmissions = quizSubmissions.filter((s) => studentIds.has(s.studentId));
      interactions = interactions.filter((i) => studentIds.has(i.studentId));
      leaves = leaves.filter((l) => studentIds.has(l.studentId));
    }

    if (filters.courseId) {
      attendance = attendance.filter((a) => a.courseId === filters.courseId);
      const assignmentIds = new Set(
        this.dataset.assignments
          .filter((a) => a.courseId === filters.courseId)
          .map((a) => a.id)
      );
      assignmentSubmissions = assignmentSubmissions.filter((s) => assignmentIds.has(s.assignmentId));
      const quizIds = new Set(
        this.dataset.quizzes
          .filter((q) => q.courseId === filters.courseId)
          .map((q) => q.id)
      );
      quizSubmissions = quizSubmissions.filter((s) => quizIds.has(s.quizId));
      interactions = interactions.filter((i) => i.courseId === filters.courseId);
    }

    if (filters.studentIds && filters.studentIds.length > 0) {
      const studentIdSet = new Set(filters.studentIds);
      students = students.filter((s) => studentIdSet.has(s.id));
      attendance = attendance.filter((a) => studentIdSet.has(a.studentId));
      assignmentSubmissions = assignmentSubmissions.filter((s) => studentIdSet.has(s.studentId));
      quizSubmissions = quizSubmissions.filter((s) => studentIdSet.has(s.studentId));
      interactions = interactions.filter((i) => studentIdSet.has(i.studentId));
      leaves = leaves.filter((l) => studentIdSet.has(l.studentId));
    }

    if (filters.weekStart !== undefined && filters.weekEnd !== undefined) {
      attendance = attendance.filter(
        (a) => a.weekNumber >= filters.weekStart! && a.weekNumber <= filters.weekEnd!
      );
      const assignmentIds = new Set(
        this.dataset.assignments
          .filter((a) => a.weekNumber >= filters.weekStart! && a.weekNumber <= filters.weekEnd!)
          .map((a) => a.id)
      );
      assignmentSubmissions = assignmentSubmissions.filter((s) => assignmentIds.has(s.assignmentId));
      const quizIds = new Set(
        this.dataset.quizzes
          .filter((q) => q.weekNumber >= filters.weekStart! && q.weekNumber <= filters.weekEnd!)
          .map((q) => q.id)
      );
      quizSubmissions = quizSubmissions.filter((s) => quizIds.has(s.quizId));
      interactions = interactions.filter(
        (i) => i.weekNumber >= filters.weekStart! && i.weekNumber <= filters.weekEnd!
      );
    }

    if (filters.questionType) {
      quizSubmissions = quizSubmissions.map((s) => ({
        ...s,
        questionScores: s.questionScores.filter((q) => q.questionType === filters.questionType),
      }));
    }

    return { students, attendance, assignmentSubmissions, quizSubmissions, interactions, leaves };
  }

  calculateStudentMetrics(filters: FilterParams): StudentMetrics[] {
    const { students, attendance, assignmentSubmissions, quizSubmissions, interactions } =
      this.filterData(filters);

    return students.map((student) => {
      const studentAttendance = attendance.filter((a) => a.studentId === student.id);
      const studentAssignments = assignmentSubmissions.filter((s) => s.studentId === student.id);
      const studentQuizzes = quizSubmissions.filter((s) => s.studentId === student.id);
      const studentInteractions = interactions.filter((i) => i.studentId === student.id);

      const totalAttendance = studentAttendance.length;
      const presentCount = studentAttendance.filter((a) => a.status === 'present' || a.status === 'excused').length;
      const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;
      const absentCount = studentAttendance.filter((a) => a.status === 'absent').length;
      const lateCount = studentAttendance.filter((a) => a.status === 'late' || a.status === 'early').length;

      const validScores = studentAssignments
        .filter((s) => s.score !== null && !s.isMissing)
        .map((s) => s.score as number);
      const assignmentAvgScore = validScores.length > 0 ? mean(validScores) : 0;
      const assignmentSubmissionRate =
        studentAssignments.length > 0
          ? ((studentAssignments.length - studentAssignments.filter((s) => s.isMissing).length) /
              studentAssignments.length) *
            100
          : 100;

      const quizScores = studentQuizzes
        .filter((s) => s.totalScore !== null && !s.isMissing)
        .map((s) => s.totalScore as number);
      const quizAvgScore = quizScores.length > 0 ? mean(quizScores) : 0;

      const interactionCount = studentInteractions.length;
      const interactionQuality =
        studentInteractions.length > 0
          ? mean(studentInteractions.map((i) => i.qualityScore)) * 10
          : 0;

      const overallScore =
        attendanceRate * 0.25 +
        assignmentAvgScore * 0.3 +
        quizAvgScore * 0.3 +
        interactionQuality * 0.15;

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (overallScore < 60 || attendanceRate < 70 || assignmentSubmissionRate < 60) {
        riskLevel = 'high';
      } else if (overallScore < 75 || attendanceRate < 85 || assignmentSubmissionRate < 80) {
        riskLevel = 'medium';
      }

      return {
        studentId: student.id,
        studentName: student.fullName,
        studentIdNumber: student.studentId,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        absentCount,
        lateCount,
        assignmentAvgScore: Math.round(assignmentAvgScore * 10) / 10,
        assignmentSubmissionRate: Math.round(assignmentSubmissionRate * 10) / 10,
        quizAvgScore: Math.round(quizAvgScore * 10) / 10,
        interactionCount,
        interactionQuality: Math.round(interactionQuality * 10) / 10,
        overallScore: Math.round(overallScore * 10) / 10,
        riskLevel,
      };
    });
  }

  getRadarChartData(filters: FilterParams, studentIds?: string[]): RadarChartData {
    const metrics = this.calculateStudentMetrics(filters);

    const indicators = [
      { name: '出勤率', max: 100 },
      { name: '作业均分', max: 100 },
      { name: '作业提交率', max: 100 },
      { name: '测验均分', max: 100 },
      { name: '互动次数', max: 100 },
      { name: '互动质量', max: 100 },
    ];

    let series: RadarChartData['series'] = [];

    if (studentIds && studentIds.length > 0) {
      series = studentIds
        .map((id) => {
          const m = metrics.find((m) => m.studentId === id);
          if (!m) return null;
          return {
            name: m.studentName,
            value: [
              m.attendanceRate,
              m.assignmentAvgScore,
              m.assignmentSubmissionRate,
              m.quizAvgScore,
              Math.min(m.interactionCount * 2, 100),
              m.interactionQuality,
            ],
          };
        })
        .filter((s): s is RadarChartData['series'][0] => s !== null);
    }

    if (series.length === 0) {
      const avgMetrics = {
        attendanceRate: mean(metrics.map((m) => m.attendanceRate)),
        assignmentAvgScore: mean(metrics.map((m) => m.assignmentAvgScore)),
        assignmentSubmissionRate: mean(metrics.map((m) => m.assignmentSubmissionRate)),
        quizAvgScore: mean(metrics.map((m) => m.quizAvgScore)),
        interactionCount: mean(metrics.map((m) => m.interactionCount)),
        interactionQuality: mean(metrics.map((m) => m.interactionQuality)),
      };

      series = [
        {
          name: '班级平均',
          value: [
            avgMetrics.attendanceRate,
            avgMetrics.assignmentAvgScore,
            avgMetrics.assignmentSubmissionRate,
            avgMetrics.quizAvgScore,
            Math.min(avgMetrics.interactionCount * 2, 100),
            avgMetrics.interactionQuality,
          ],
        },
      ];
    }

    return { indicators, series };
  }

  getScoreBoxPlotData(filters: FilterParams): BoxPlotData[] {
    const { assignmentSubmissions, quizSubmissions } = this.filterData(filters);

    const assignmentScores = assignmentSubmissions
      .filter((s) => s.score !== null && !s.isMissing)
      .map((s) => s.score as number);

    const quizScores = quizSubmissions
      .filter((s) => s.totalScore !== null && !s.isMissing)
      .map((s) => s.totalScore as number);

    return [
      {
        category: '作业成绩',
        values: assignmentScores,
        stats: boxPlotStats(assignmentScores),
        outliers: boxPlotStats(assignmentScores).outliers,
      },
      {
        category: '测验成绩',
        values: quizScores,
        stats: boxPlotStats(quizScores),
        outliers: boxPlotStats(quizScores).outliers,
      },
    ];
  }

  getAttendanceTrendData(filters: FilterParams): TrendDataPoint[] {
    const { attendance } = this.filterData(filters);
    const weeklyData = new Map<number, { total: number; present: number }>();

    attendance.forEach((a) => {
      const week = a.weekNumber;
      if (!weeklyData.has(week)) {
        weeklyData.set(week, { total: 0, present: 0 });
      }
      const data = weeklyData.get(week)!;
      data.total++;
      if (a.status === 'present' || a.status === 'excused') {
        data.present++;
      }
    });

    return Array.from(weeklyData.entries())
      .sort(([a], [b]) => a - b)
      .map(([week, data]) => ({
        week,
        value: data.total > 0 ? Math.round((data.present / data.total) * 1000) / 10 : 0,
        label: `第${week}周`,
      }));
  }

  getScoreTrendData(filters: FilterParams): {
    assignmentTrend: TrendDataPoint[];
    quizTrend: TrendDataPoint[];
  } {
    const { assignmentSubmissions, quizSubmissions } = this.filterData(filters);

    const assignmentWeekly = new Map<number, { scores: number[] }>();
    const quizWeekly = new Map<number, { scores: number[] }>();

    const assignmentWeekMap = new Map(
      this.dataset.assignments.map((a) => [a.id, a.weekNumber])
    );
    const quizWeekMap = new Map(this.dataset.quizzes.map((q) => [q.id, q.weekNumber]));

    assignmentSubmissions.forEach((s) => {
      if (s.score === null || s.isMissing) return;
      const week = assignmentWeekMap.get(s.assignmentId) || 1;
      if (!assignmentWeekly.has(week)) {
        assignmentWeekly.set(week, { scores: [] });
      }
      assignmentWeekly.get(week)!.scores.push(s.score as number);
    });

    quizSubmissions.forEach((s) => {
      if (s.totalScore === null || s.isMissing) return;
      const week = quizWeekMap.get(s.quizId) || 1;
      if (!quizWeekly.has(week)) {
        quizWeekly.set(week, { scores: [] });
      }
      quizWeekly.get(week)!.scores.push(s.totalScore as number);
    });

    const assignmentTrend = Array.from(assignmentWeekly.entries())
      .sort(([a], [b]) => a - b)
      .map(([week, data]) => ({
        week,
        value: Math.round(mean(data.scores) * 10) / 10,
        label: `第${week}周`,
      }));

    const quizTrend = Array.from(quizWeekly.entries())
      .sort(([a], [b]) => a - b)
      .map(([week, data]) => ({
        week,
        value: Math.round(mean(data.scores) * 10) / 10,
        label: `第${week}周`,
      }));

    return { assignmentTrend, quizTrend };
  }

  getLeaveReasonsStat(filters: FilterParams): LeaveReasonStat[] {
    const { leaves } = this.filterData(filters);
    const freq = frequency(leaves.map((l) => l.leaveType));
    const total = leaves.length;

    return Array.from(freq.entries()).map(([type, count]) => ({
      type,
      label: DATA_DICTIONARY.leaveType[type as keyof typeof DATA_DICTIONARY.leaveType]?.label || type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      color: DATA_DICTIONARY.leaveType[type as keyof typeof DATA_DICTIONARY.leaveType]?.color || '#6b7280',
    }));
  }

  getQuestionTypeAnalysis(filters: FilterParams) {
    const { quizSubmissions } = this.filterData(filters);
    const typeScores = new Map<string, { scores: number[]; maxScores: number[] }>();

    quizSubmissions.forEach((s) => {
      s.questionScores.forEach((qs) => {
        if (!typeScores.has(qs.questionType)) {
          typeScores.set(qs.questionType, { scores: [], maxScores: [] });
        }
        const data = typeScores.get(qs.questionType)!;
        data.scores.push(qs.score);
        data.maxScores.push(qs.maxScore);
      });
    });

    return Array.from(typeScores.entries()).map(([type, data]) => {
      const totalScore = data.scores.reduce((a, b) => a + b, 0);
      const totalMax = data.maxScores.reduce((a, b) => a + b, 0);
      return {
        type,
        label: DATA_DICTIONARY.questionType[type as keyof typeof DATA_DICTIONARY.questionType]?.label || type,
        avgScore: Math.round((totalScore / data.scores.length) * 10) / 10,
        avgPercentage: totalMax > 0 ? Math.round((totalScore / totalMax) * 1000) / 10 : 0,
        count: data.scores.length,
      };
    });
  }

  getAnomalyStudents(filters: FilterParams) {
    const metrics = this.calculateStudentMetrics(filters);
    const highRisk = metrics.filter((m) => m.riskLevel === 'high');
    const mediumRisk = metrics.filter((m) => m.riskLevel === 'medium');

    const attendanceScores = metrics.map((m) => m.attendanceRate);
    const attendanceOutliers = detectOutliers(attendanceScores, 'attendanceRate');

    const scores = metrics.map((m) => m.overallScore);
    const scoreOutliers = detectOutliers(scores, 'overallScore');

    const outlierIndices = new Set([
      ...attendanceOutliers.outliers.map((o) => o.index),
      ...scoreOutliers.outliers.map((o) => o.index),
    ]);

    const outlierStudents = Array.from(outlierIndices).map((idx) => metrics[idx]);

    return {
      highRiskStudents: highRisk,
      mediumRiskStudents: mediumRisk,
      outlierStudents,
      attendanceOutliers,
      scoreOutliers,
    };
  }

  getDataQualityInfo(filters: FilterParams): DataQualityInfo {
    const { students, attendance, assignmentSubmissions, quizSubmissions, interactions } =
      this.filterData(filters);

    const attendanceRecords = attendance as unknown as Record<string, unknown>[];
    const assignmentRecords = assignmentSubmissions as unknown as Record<string, unknown>[];
    const quizRecords = quizSubmissions as unknown as Record<string, unknown>[];

    const attendanceMissing = detectMissingValues(attendanceRecords, ['status', 'date', 'studentId']);
    const assignmentMissing = detectMissingValues(assignmentRecords, ['score', 'submittedAt']);
    const quizMissing = detectMissingValues(quizRecords, ['totalScore', 'submittedAt']);

    const scores = [
      ...assignmentSubmissions.filter((s) => s.score !== null).map((s) => s.score as number),
      ...quizSubmissions.filter((s) => s.totalScore !== null).map((s) => s.totalScore as number),
    ];
    const scoreOutliers = detectOutliers(scores, 'scores');

    const attendanceRates = students.map((s) => {
      const sa = attendance.filter((a) => a.studentId === s.id);
      const present = sa.filter((a) => a.status === 'present').length;
      return sa.length > 0 ? (present / sa.length) * 100 : 100;
    });
    const attendanceOutliers = detectOutliers(attendanceRates, 'attendance');

    return {
      totalStudents: students.length,
      totalRecords: {
        attendance: attendance.length,
        assignments: assignmentSubmissions.length,
        quizzes: quizSubmissions.length,
        interactions: interactions.length,
      },
      missingRate: {
        attendance: Math.round(attendanceMissing.overallMissingRate * 1000) / 10,
        assignments: Math.round(assignmentMissing.overallMissingRate * 1000) / 10,
        quizzes: Math.round(quizMissing.overallMissingRate * 1000) / 10,
      },
      outlierCount: {
        scores: scoreOutliers.outliers.length,
        attendance: attendanceOutliers.outliers.length,
      },
      sampleSize: students.length,
      updateTime: this.dataset.updateTime,
      filters,
    };
  }

  getStudentDetail(studentId: string, filters: FilterParams) {
    const student = this.dataset.students.find((s) => s.id === studentId);
    if (!student) return null;

    const metrics = this.calculateStudentMetrics(filters).find((m) => m.studentId === studentId);
    const { attendance, assignmentSubmissions, quizSubmissions, interactions, leaves } =
      this.filterData({ ...filters, studentIds: [studentId] });

    return {
      student,
      metrics,
      attendanceHistory: attendance.sort((a, b) => a.date.localeCompare(b.date)),
      assignments: assignmentSubmissions.map((s) => ({
        ...s,
        assignment: this.dataset.assignments.find((a) => a.id === s.assignmentId),
      })),
      quizzes: quizSubmissions.map((s) => ({
        ...s,
        quiz: this.dataset.quizzes.find((q) => q.id === s.quizId),
      })),
      interactions,
      leaves,
    };
  }

  getStudentGeoData(filters: FilterParams) {
    const { students } = this.filterData(filters);
    const metrics = this.calculateStudentMetrics(filters);

    return students.map((s) => {
      const m = metrics.find((m) => m.studentId === s.id);
      return {
        id: s.id,
        name: s.fullName,
        latitude: s.latitude,
        longitude: s.longitude,
        overallScore: m?.overallScore || 0,
        riskLevel: m?.riskLevel || 'low',
        attendanceRate: m?.attendanceRate || 0,
      };
    });
  }
}
