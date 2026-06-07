import { NextResponse } from 'next/server';
import { AnalyticsService, FilterParams } from '@/lib/services/analytics';
import { mockDataset } from '@/lib/mock/data';
import { getCurrentUser, checkPermission, ROLES, maskPhone, maskEmail } from '@/lib/auth';
import { DATA_DICTIONARY } from '@/lib/constants/data-dictionary';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const {
      filters, format = 'csv', hideContact = true, includeQualityReport = true } = body;

    const canViewContact = checkPermission(user.roles, [ROLES.ADMIN, ROLES.DEAN, ROLES.HEAD_TEACHER]);
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
        className: student?.className,
      };
    });

    const headers = [
      '学号',
      '姓名',
      '班级',
      '出勤率(%)',
      '缺勤次数',
      '迟到次数',
      '作业均分',
      '作业提交率(%)',
      '测验均分',
      '课堂互动次数',
      '互动质量',
      '综合评分',
      '风险等级',
    ];

    if (!actuallyHideContact) {
      headers.push('联系电话', '邮箱');
    }

    const rows = students.map((s) => {
      const row = [
        s.studentIdNumber,
        s.studentName,
        s.className || '',
        s.attendanceRate,
        s.absentCount,
        s.lateCount,
        s.assignmentAvgScore,
        s.assignmentSubmissionRate,
        s.quizAvgScore,
        s.interactionCount,
        s.interactionQuality,
        s.overallScore,
        s.riskLevel === 'low' ? '低' : s.riskLevel === 'medium' ? '中' : '高',
      ];

      if (!actuallyHideContact) {
        row.push(s.phone || '', s.email || '');
      }

      return row;
    });

    let content = '\ufeff';

    content += '# 班级出勤与学习表现分析报告\n';
    content += `# 导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
    content += `# 数据更新时间: ${new Date(qualityInfo.updateTime).toLocaleString('zh-CN')}\n`;
    content += `# 样本量: ${qualityInfo.sampleSize} 人\n`;
    content += `# 导出人: ${user.username}\n`;
    content += '# 筛选条件: ';
    const filterDescriptions: string[] = [];
    if (filters.classId) {
      const cls = mockDataset.classes.find((c) => c.id === filters.classId);
      filterDescriptions.push(`班级: ${cls?.name || filters.classId}`);
    }
    if (filters.courseId) {
      const course = mockDataset.courses.find((c) => c.id === filters.courseId);
      filterDescriptions.push(`课程: ${course?.name || filters.courseId}`);
    }
    if (filters.weekStart && filters.weekEnd) {
      filterDescriptions.push(`周次: ${filters.weekStart}-${filters.weekEnd}`);
    }
    content += filterDescriptions.length > 0 ? filterDescriptions.join(', ') : '无';
    content += '\n';
    
    if (actuallyHideContact) {
      content += '# 注意: 联系方式已根据权限脱敏\n';
    }
    content += '\n';

    if (includeQualityReport) {
      content += '# ===== 数据质量报告 =====\n';
      content += `#,缺失率-出勤,${qualityInfo.missingRate.attendance}%\n`;
      content += `#,缺失率-作业,${qualityInfo.missingRate.assignments}%\n`;
      content += `#,缺失率-测验,${qualityInfo.missingRate.quizzes}%\n`;
      content += `#,成绩异常值,${qualityInfo.outlierCount.scores}个\n`;
      content += `#,出勤异常值,${qualityInfo.outlierCount.attendance}个\n`;
      content += '\n';
    }

    content += headers.join(',') + '\n';
    rows.forEach((row) => {
      content += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });

    const fileName = `班级表现分析_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
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
