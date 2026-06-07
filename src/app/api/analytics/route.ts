import { NextResponse } from 'next/server';
import { AnalyticsService, FilterParams } from '@/lib/services/analytics';
import { mockDataset } from '@/lib/mock/data';
import { getCurrentUser, sanitizeStudentData, checkPermission, ROLES } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters: FilterParams = {
      classId: searchParams.get('classId') || undefined,
      courseId: searchParams.get('courseId') || undefined,
      teacherId: searchParams.get('teacherId') || undefined,
      weekStart: searchParams.get('weekStart') ? Number(searchParams.get('weekStart')) : undefined,
      weekEnd: searchParams.get('weekEnd') ? Number(searchParams.get('weekEnd')) : undefined,
      questionType: searchParams.get('questionType') || undefined,
    };

    const canViewContact = checkPermission(user.roles, [ROLES.ADMIN, ROLES.DEAN, ROLES.HEAD_TEACHER]);
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

    const sanitizedMetrics = studentMetrics.map((m) => {
      const student = mockDataset.students.find((s) => s.id === m.studentId);
      if (student && !canViewContact) {
        sanitizeStudentData(student, false);
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
        canViewContact,
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
