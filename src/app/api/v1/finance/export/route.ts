import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission, formatDate, formatCurrency } from '@/lib/utils';
import ExcelJS from 'exceljs';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (!hasPermission(session.user.role || 'USER', ['SUPER_ADMIN', 'COMMITTEE'])) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const category = searchParams.get('category');

    const where: any = {};
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(startDate);
      if (endDate) where.recordedAt.lte = new Date(endDate);
    }
    if (type) where.type = type;
    if (category) where.category = category;

    const records = await prisma.financeRecord.findMany({
      where,
      include: {
        recordedBy: {
          select: { name: true, email: true },
        },
        relatedOrder: {
          select: { orderNo: true },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });

    const totalIncome = records
      .filter((r) => r.type === 'INCOME')
      .reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);
    const totalExpense = records
      .filter((r) => r.type === 'EXPENSE')
      .reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('财务报表');

    const filterCriteria: string[] = [];
    filterCriteria.push(`导出时间：${formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
    filterCriteria.push(`操作人：${session.user.name}`);
    if (startDate) filterCriteria.push(`开始日期：${startDate}`);
    if (endDate) filterCriteria.push(`结束日期：${endDate}`);
    if (type) filterCriteria.push(`类型：${type === 'INCOME' ? '收入' : '支出'}`);
    if (category) filterCriteria.push(`分类：${category}`);
    filterCriteria.push(`记录总数：${records.length} 条`);

    worksheet.addRow(['筛选口径']);
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.mergeCells('A1:H1');

    filterCriteria.forEach((criteria, index) => {
      worksheet.addRow([criteria]);
      worksheet.getCell(`A${index + 2}`).font = { size: 11 };
      worksheet.mergeCells(`A${index + 2}:H${index + 2}`);
    });

    worksheet.addRow([]);
    const headerRow = worksheet.addRow([
      '日期',
      '类型',
      '分类',
      '金额',
      '描述',
      '相关订单',
      '记录人',
      '有附件',
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF8B0000' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    records.forEach((record) => {
      worksheet.addRow([
        formatDate(record.recordedAt, 'yyyy-MM-dd HH:mm:ss'),
        record.type === 'INCOME' ? '收入' : '支出',
        record.category,
        parseFloat(record.amount.toString()),
        record.description || '',
        record.relatedOrder?.orderNo || '',
        record.recordedBy.name,
        record.receiptUrl ? '是' : '否',
      ]);
    });

    worksheet.addRow([]);
    const summaryRow = worksheet.addRow([
      '合计',
      '',
      `总收入：${formatCurrency(totalIncome)}`,
      '',
      `总支出：${formatCurrency(totalExpense)}`,
      '',
      `净利润：${formatCurrency(totalIncome - totalExpense)}`,
      '',
    ]);
    summaryRow.eachCell((cell) => {
      cell.font = { bold: true };
    });

    worksheet.columns = [
      { width: 22 },
      { width: 8 },
      { width: 15 },
      { width: 12 },
      { width: 30 },
      { width: 18 },
      { width: 12 },
      { width: 8 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="finance-report-${formatDate(new Date(), 'yyyyMMdd')}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Failed to export finance report:', error);
    return NextResponse.json(
      { error: '导出报表失败' },
      { status: 500 }
    );
  }
}
