import { NextResponse } from 'next/server';
import { AnalyticsService, FilterParams } from '@/lib/services/analytics';
import { mockDataset } from '@/lib/mock/data';
import { checkPermission, ROLES, maskPhone, maskEmail } from '@/lib/auth';
import { getAuthContext } from '@/lib/middleware-auth';
import { DATA_DICTIONARY } from '@/lib/constants/data-dictionary';

export async function POST(request: Request) {
  try {
    let auth;
    try {
      auth = await getAuthContext(request as any);
    } catch (e) {
      console.warn('Auth context failed, using default permissions for export');
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

    if (!effectiveAuth.canExportData) {
      return NextResponse.json(
        { error: '权限不足，无法导出数据', success: false },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      filters, format = 'csv', hideContact = true, includeQualityReport = true } = body;

    const canViewContact = effectiveAuth.canViewContact;
    const actuallyHideContact = hideContact || !canViewContact;

    const analytics = new AnalyticsService(mockDataset);
    const studentMetrics = analytics.calculateStudentMetrics(filters as FilterParams);
    const qualityInfo = analytics.getDataQualityInfo(filters as FilterParams);

    const students = studentMetrics.map((m) => {
      const student = mockDataset.students.find((s) => s.id === m.studentId);
      return {
        ...m,
        phone: actuallyHideContact ? maskPhone(student?.phone) : student?.phone,
        email: actuallyHideContact ? maskEmail(student?.email) : student?.email,
      };
    });

    if (format === 'csv') {
      const headers = [
        '学号', '姓名', '出勤率', '缺勤次数', '迟到次数', '请假次数',
        '作业平均分', '测验平均分', '综合得分', '风险等级'
      ];
      
      const rows = students.map(s => [
        s.studentIdNumber,
        s.studentName,
        `${s.attendanceRate}%`,
        s.absentCount,
        s.lateCount,
        s.leaveCount,
        s.assignmentAvgScore,
        s.quizAvgScore,
        s.overallScore,
        s.riskLevel === 'high' ? '高风险' : s.riskLevel === 'medium' ? '中风险' : '低风险'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="学生表现分析_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        students,
        qualityInfo,
        dataDictionary: DATA_DICTIONARY,
        exportedAt: new Date().toISOString(),
        filters,
      },
    });
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: '导出失败', success: false },
      { status: 500 }
    );
  }
}
