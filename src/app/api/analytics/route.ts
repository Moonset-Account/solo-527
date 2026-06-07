import { NextResponse } from 'next/server';
import { AnalyticsService, FilterParams } from '@/lib/services/analytics';
import { mockDataset } from '@/lib/mock/data';
import { getAuthContext } from '@/lib/middleware-auth';
import { sanitizeStudentData } from '@/lib/auth';

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
      permittedClassIds: mockDataset.classes.map(c => c.id),
      canViewContact: false,
      canImportData: true,
      canExportData: true,
    };

    const effectiveAuth = auth || defaultAuth;
    const permittedClassIds = effectiveAuth.permittedClassIds.length > 0
      ? effectiveAuth.permittedClassIds
      : mockDataset.classes.map(c => c.id);

    const { searchParams } = new URL(request.url);
    const filters: FilterParams = {
      classId: searchParams.get('classId') || undefined,
      courseId: searchParams.get('courseId') || undefined,
      teacherId: searchParams.get('teacherId') || undefined,
      weekStart: searchParams.get('weekStart') ? Number(searchParams.get('weekStart')) : undefined,
      weekEnd: searchParams.get('weekEnd') ? Number(searchParams.get('weekEnd')) : undefined,
      questionType: searchParams.get('questionType') || undefined,
    };

    const analytics = new AnalyticsService(mockDataset);
    const studentMetrics = analytics.calculateStudentMetrics(filters);

    const radarData = analytics.getRadarChartData(filters);
    const boxPlotData = analytics.getScoreBoxPlotData(filters);
    const attendanceTrend = analytics.getAttendanceTrendData(filters);
    const scoreTrend = analytics.getScoreTrendData(filters);
    const leaveReasons = analytics.getLeaveReasonsStat(filters);
    const questionTypeAnalysis = analytics.getQuestionTypeAnalysis(filters);
    const anomalyData = analytics.getAnomalyStudents(filters);
    const qualityInfo = analytics.getDataQualityInfo(filters);
    const geoData = analytics.getStudentGeoData(filters);

    const sanitizedMetrics = studentMetrics.map((m: any) => {
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
        studentMetrics: sanitizedMetrics,
        radarData,
        boxPlotData,
        attendanceTrend,
        scoreTrend,
        leaveReasons,
        questionTypeAnalysis,
        anomalyData,
        qualityInfo,
        geoData,
        canViewContact: effectiveAuth.canViewContact,
        canImportData: effectiveAuth.canImportData,
        canExportData: effectiveAuth.canExportData,
        useMockData: true,
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
      { error: '服务器内部错误', success: false },
      { status: 500 }
    );
  }
}
