import { NextResponse } from 'next/server';
import { getCurrentUser, checkPermission, ROLES, PERMISSIONS } from '@/lib/auth';
import { detectMissingValues } from '@/lib/utils/data-quality';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!checkPermission(user.roles, [ROLES.ADMIN, ROLES.DEAN])) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { error: '未上传文件', success: false },
        { status: 400 }
      );
    }

    const content = await file.text();
    const lines = content.split('\n').filter((line) => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: '文件内容为空或格式不正确', success: false },
        { status: 400 }
      );
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const records = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        record[h] = values[i] || '';
      });
      return record;
    });

    const missingReport = detectMissingValues(records, headers);
    const errors: string[] = [];

    records.forEach((record, idx) => {
      if (!record['学号'] && !record['studentId']) {
        errors.push(`第 ${idx + 2} 行: 缺少学号`);
      }
      if (!record['姓名'] && !record['fullName']) {
        errors.push(`第 ${idx + 2} 行: 缺少姓名`);
      }
    });

    const successful = records.length - errors.length;

    return NextResponse.json({
      success: true,
      data: {
        importType,
        fileName: file.name,
        totalRecords: records.length,
        successfulRecords: successful,
        failedRecords: errors.length,
        errors,
        missingReport,
        preview: records.slice(0, 5),
      },
      message: `导入成功 ${successful} 条，失败 ${errors.length} 条`,
    });
  } catch (error) {
    console.error('Import API error:', error);
    return NextResponse.json(
      { error: '导入失败', success: false },
      { status: 500 }
    );
  }
}
