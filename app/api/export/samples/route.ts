import { NextResponse } from 'next/server';
import * as dataAccess from '@/lib/dataAccess';

const abnormalTypeMap: Record<string, string> = {
  fast_answer: '答题过快',
  duplicate_submission: '重复提交',
  device_concentration: '设备集中',
  skip_abnormal: '跳题异常',
  open_copy: '开放题复制',
};

const statusMap: Record<string, string> = {
  pending: '待复核',
  approved: '已通过',
  rejected: '已拒绝',
};

const EXPORT_PERMISSION = 'export_samples';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const format = searchParams.get('format') || 'csv';
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');

    if (!channelId) {
      return NextResponse.json(
        { success: false, error: '请指定渠道ID' },
        { status: 400 }
      );
    }

    if (!userId && !username) {
      return NextResponse.json(
        { success: false, error: '请指定用户身份（userId 或 username）' },
        { status: 401 }
      );
    }

    let actualUserId = '';
    let userInfo = null;

    if (userId) {
      userInfo = await dataAccess.getUserById(userId);
      if (userInfo) {
        actualUserId = userInfo.id;
      }
    }
    
    if (!actualUserId && username) {
      userInfo = await dataAccess.getUserByUsername(username);
      if (userInfo) {
        actualUserId = userInfo.id;
      }
    }

    if (!actualUserId || !userInfo) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 401 }
      );
    }

    const hasPermission = await dataAccess.checkUserPermission(actualUserId, EXPORT_PERMISSION);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: '您没有导出数据的权限，请联系管理员' },
        { status: 403 }
      );
    }

    const exportableChannels = await dataAccess.getExportableChannelsForUser(actualUserId);
    if (!exportableChannels.includes(channelId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `您没有该渠道的数据导出权限。您可导出的渠道: ${exportableChannels.join(', ') || '无'}` 
        },
        { status: 403 }
      );
    }

    const channel = await dataAccess.getChannelById(channelId);
    if (!channel) {
      return NextResponse.json(
        { success: false, error: '渠道不存在' },
        { status: 404 }
      );
    }

    const samples = await dataAccess.getSamplesByChannel(channelId);

    const headers = [
      '样本ID',
      '渠道',
      '答题时长(秒)',
      'IP区域',
      '异常类型',
      '状态',
      '提交时间',
    ];

    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...samples.map(s => [
          s.id,
          s.channelName,
          s.totalDuration,
          s.ipRegion,
          s.abnormalTypes.map(t => abnormalTypeMap[t] || t).join('|'),
          statusMap[s.status] || s.status,
          s.submittedAt,
        ].join(','))
      ].join('\n');

      try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
        await dataAccess.logExportAction(
          actualUserId,
          channelId,
          format,
          samples.length,
          ip
        );
      } catch (logError) {
        console.error('记录导出日志失败:', logError);
      }

      return new NextResponse('\ufeff' + csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="samples_${channelId}_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        samples,
        user: userInfo,
        exportableChannels,
      },
    });
  } catch (error) {
    console.error('导出失败:', error);
    return NextResponse.json(
      { success: false, error: '导出失败，请稍后重试' },
      { status: 500 }
    );
  }
}
