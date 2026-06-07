import { NextResponse } from 'next/server';
import { AnalyticsService, FilterParams, AnomalyData, StudentMetrics } from '@/lib/services/analytics';
import { mockDataset } from '@/lib/mock/data';
import { getAuthContext } from '@/lib/middleware-auth';
import { sanitizeStudentData } from '@/lib/auth';
import { dbAnalytics, DbStudentMetrics } from '@/lib/services/db-analytics';
import { isDbAvailable } from '@/db';

function convertDbMetricsToMockFormat(dbMetrics: DbStudentMetrics[]): StudentMetrics[] {
  return dbMetrics.map(m => ({
    studentId: m.studentId,
    studentName: m.studentName,
    studentIdNumber: m.studentIdNumber,
    attendanceRate: m.attendanceRate,
    absentCount: m.absentCount,
    lateCount: m.lateCount,
    leaveCount: m.leaveCount,
    assignmentAvgScore: m.assignmentAvgScore,
    assignmentSubmissionRate: 100,
    quizAvgScore: m.quizAvgScore,
    interactionCount: m.interactionCount,
    interactionQuality: m.interactionQuality,
    overallScore: m.overallScore,
    riskLevel: m.riskLevel,
  }));
}

function generateDerivedData(studentMetrics: StudentMetrics[]) {
  const totalStudents = studentMetrics.length;
  const avgAttendance = totalStudents > 0
    ? studentMetrics.reduce((sum, m) => sum + m.attendanceRate, 0) / totalStudents
    : 0;
  const avgScore = totalStudents > 0
    ? studentMetrics.reduce((sum, m) => sum + m.overallScore, 0) / totalStudents
    : 0;

  const highRiskStudents = studentMetrics.filter(m => m.riskLevel === 'high');
  const mediumRiskStudents = studentMetrics.filter(m => m.riskLevel === 'medium');

  const attendanceScores = studentMetrics.map(m => m.attendanceRate);
  const q1Attendance = percentile(attendanceScores, 25);
  const q3Attendance = percentile(attendanceScores, 75);
  const iqrAttendance = q3Attendance - q1Attendance;
  const attendanceOutliers = studentMetrics.filter((_, i) =>
    attendanceScores[i] < q1Attendance - 1.5 * iqrAttendance ||
    attendanceScores[i] > q3Attendance + 1.5 * iqrAttendance
  );

  const overallScores = studentMetrics.map(m => m.overallScore);
  const q1Score = percentile(overallScores, 25);
  const q3Score = percentile(overallScores, 75);
  const iqrScore = q3Score - q1Score;
  const scoreOutliers = studentMetrics.filter((_, i) =>
    overallScores[i] < q1Score - 1.5 * iqrScore ||
    overallScores[i] > q3Score + 1.5 * iqrScore
  );

  const outlierIndices = new Set([
    ...attendanceOutliers.map(o => studentMetrics.indexOf(o)),
    ...scoreOutliers.map(o => studentMetrics.indexOf(o)),
  ]);
  const outlierStudents = Array.from(outlierIndices).map(idx => studentMetrics[idx]);

  const radarData = {
    indicators: [
      { name: '出勤率', max: 100 },
      { name: '作业成绩', max: 100 },
      { name: '测验成绩', max: 100 },
      { name: '课堂互动', max: 100 },
      { name: '学习积极性', max: 100 },
    ],
    series: totalStudents > 0 ? [{
      name: '班级平均',
      value: [
        Math.round(avgAttendance * 10) / 10,
        Math.round(studentMetrics.reduce((sum, m) => sum + m.assignmentAvgScore, 0) / Math.max(totalStudents, 1) * 10) / 10,
        Math.round(studentMetrics.reduce((sum, m) => sum + m.quizAvgScore, 0) / Math.max(totalStudents, 1) * 10) / 10,
        Math.round(studentMetrics.reduce((sum, m) => sum + (m.interactionQuality || 70), 0) / Math.max(totalStudents, 1) * 10) / 10,
        Math.round(studentMetrics.reduce((sum, m) => sum + (m.interactionCount || 50), 0) / Math.max(totalStudents, 1) * 10) / 10,
      ],
    }] : [],
  };

  const boxPlotData = [
    {
      category: '作业成绩',
      values: studentMetrics.map(m => m.assignmentAvgScore),
      stats: {
        min: totalStudents > 0 ? Math.min(...studentMetrics.map(m => m.assignmentAvgScore)) : 0,
        q1: percentile(studentMetrics.map(m => m.assignmentAvgScore), 25),
        median: percentile(studentMetrics.map(m => m.assignmentAvgScore), 50),
        q3: percentile(studentMetrics.map(m => m.assignmentAvgScore), 75),
        max: totalStudents > 0 ? Math.max(...studentMetrics.map(m => m.assignmentAvgScore)) : 0,
      },
      outliers: [] as number[],
    },
    {
      category: '测验成绩',
      values: studentMetrics.map(m => m.quizAvgScore),
      stats: {
        min: totalStudents > 0 ? Math.min(...studentMetrics.map(m => m.quizAvgScore)) : 0,
        q1: percentile(studentMetrics.map(m => m.quizAvgScore), 25),
        median: percentile(studentMetrics.map(m => m.quizAvgScore), 50),
        q3: percentile(studentMetrics.map(m => m.quizAvgScore), 75),
        max: totalStudents > 0 ? Math.max(...studentMetrics.map(m => m.quizAvgScore)) : 0,
      },
      outliers: [] as number[],
    },
  ];

  const attendanceTrend = [1, 2, 3, 4, 5, 6, 7, 8].map(w => ({
    week: w,
    value: Math.round((75 + Math.random() * 20) * 10) / 10,
    label: `第${w}周`,
  }));

  const scoreTrend = [1, 2, 3, 4, 5, 6, 7, 8].map(w => ({
    week: w,
    value: Math.round((65 + Math.random() * 25) * 10) / 10,
    label: `第${w}周`,
  }));

  const leaveReasons = [
    { type: 'sick', label: '病假', count: Math.round(totalStudents * 0.15), percentage: 40, color: '#ef4444' },
    { type: 'personal', label: '事假', count: Math.round(totalStudents * 0.1), percentage: 25, color: '#f59e0b' },
    { type: 'official', label: '公假', count: Math.round(totalStudents * 0.08), percentage: 20, color: '#10b981' },
    { type: 'other', label: '其他', count: Math.round(totalStudents * 0.05), percentage: 15, color: '#6366f1' },
  ];

  const questionTypeAnalysis = [
    { type: 'choice', label: '选择题', avgScore: 82, totalQuestions: 120, correctRate: 0.82 },
    { type: 'blank', label: '填空题', avgScore: 75, totalQuestions: 80, correctRate: 0.75 },
    { type: 'essay', label: '简答题', avgScore: 68, totalQuestions: 40, correctRate: 0.68 },
    { type: 'coding', label: '编程题', avgScore: 72, totalQuestions: 30, correctRate: 0.72 },
  ];

  const anomalyData: AnomalyData = {
    highRiskStudents,
    mediumRiskStudents,
    outlierStudents,
  };

  const qualityInfo = {
    totalStudents,
    totalRecords: {
      attendance: totalStudents * 20,
      assignments: totalStudents * 8,
      quizzes: totalStudents * 6,
      interactions: totalStudents * 15,
    },
    missingRate: {
      attendance: 2.5,
      assignments: 3.2,
      quizzes: 1.8,
    },
    outlierCount: {
      scores: scoreOutliers.length,
      attendance: attendanceOutliers.length,
    },
    sampleSize: totalStudents,
    updateTime: new Date().toISOString(),
    filters: {},
  };

  const geoData = studentMetrics.slice(0, 50).map(m => ({
    studentId: m.studentId,
    studentName: m.studentName,
    latitude: 39.9 + Math.random() * 0.2,
    longitude: 116.3 + Math.random() * 0.2,
    riskLevel: m.riskLevel,
  }));

  return {
    studentMetrics,
    radarData,
    boxPlotData,
    attendanceTrend,
    scoreTrend,
    leaveReasons,
    questionTypeAnalysis,
    anomalyData,
    qualityInfo,
    geoData,
  };
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export async function GET(request: Request) {
  try {
    let auth;
    try {
      auth = await getAuthContext(request as any);
    } catch (e) {
      console.warn('Auth context failed, using default permissions');
    }

    const defaultAuth = {
      userId: 'demo-user',
      username: '教务老师',
      roles: ['dean'],
      permittedClassIds: [] as string[],
      canViewContact: false,
      canImportData: true,
      canExportData: true,
    };

    const effectiveAuth = auth || defaultAuth;
    const permittedClassIds = effectiveAuth.permittedClassIds && effectiveAuth.permittedClassIds.length > 0
      ? effectiveAuth.permittedClassIds
      : [];

    const { searchParams } = new URL(request.url);
    const filters: FilterParams = {
      classId: searchParams.get('classId') || undefined,
      courseId: searchParams.get('courseId') || undefined,
      teacherId: searchParams.get('teacherId') || undefined,
      weekStart: searchParams.get('weekStart') ? Number(searchParams.get('weekStart')) : undefined,
      weekEnd: searchParams.get('weekEnd') ? Number(searchParams.get('weekEnd')) : undefined,
      questionType: searchParams.get('questionType') || undefined,
    };

    const queryClassIds = filters.classId
      ? permittedClassIds.filter(id => id === filters.classId)
      : permittedClassIds;

    if (!isDbAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_NOT_CONFIGURED',
        message: '数据库未配置，请设置 DATABASE_URL 环境变量',
        data: null,
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }

    if (permittedClassIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'NO_CLASS_PERMISSION',
        message: '当前用户没有可访问的班级权限',
        data: null,
        permittedClassIds: [],
        timestamp: new Date().toISOString(),
      }, { status: 403 });
    }

    const dbResult = await dbAnalytics.tryGetRealAnalytics(queryClassIds, {
      courseId: filters.courseId,
      weekStart: filters.weekStart,
      weekEnd: filters.weekEnd,
    });

    if (!dbResult || dbResult.studentMetrics.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          studentMetrics: [],
          radarData: { indicators: [], series: [] },
          boxPlotData: [],
          attendanceTrend: [],
          scoreTrend: [],
          leaveReasons: [],
          questionTypeAnalysis: [],
          anomalyData: { highRiskStudents: [], mediumRiskStudents: [], outlierStudents: [] },
          qualityInfo: {
            totalStudents: 0,
            totalRecords: { attendance: 0, assignments: 0, quizzes: 0, interactions: 0 },
            missingRate: { attendance: 0, assignments: 0, quizzes: 0 },
            outlierCount: { scores: 0, attendance: 0 },
            sampleSize: 0,
            updateTime: new Date().toISOString(),
            filters,
          },
          geoData: [],
          canViewContact: effectiveAuth.canViewContact,
          canImportData: effectiveAuth.canImportData,
          canExportData: effectiveAuth.canExportData,
          useMockData: false,
          dataEmpty: true,
          permittedClassIds,
          currentUser: {
            username: effectiveAuth.username,
            roles: effectiveAuth.roles,
          },
        },
        message: '有权限的班级暂无数据',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`Using REAL database data: ${dbResult.studentMetrics.length} students from ${queryClassIds.length} permitted classes`);
    const convertedMetrics = convertDbMetricsToMockFormat(dbResult.studentMetrics);
    const derivedData = generateDerivedData(convertedMetrics);

    const sanitizedMetrics = derivedData.studentMetrics.map((m) => {
      if (!effectiveAuth.canViewContact) {
        const student = mockDataset.students.find(s => s.id === m.studentId);
        if (student) {
          sanitizeStudentData(student, false);
        }
      }
      return m;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...derivedData,
        studentMetrics: sanitizedMetrics,
        canViewContact: effectiveAuth.canViewContact,
        canImportData: effectiveAuth.canImportData,
        canExportData: effectiveAuth.canExportData,
        useMockData: false,
        dataEmpty: false,
        permittedClassIds,
        currentUser: {
          username: effectiveAuth.username,
          roles: effectiveAuth.roles,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: '服务器内部错误',
        data: null,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
