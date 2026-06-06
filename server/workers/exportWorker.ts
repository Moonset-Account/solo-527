import { Worker } from 'bullmq';
import ExcelJS from 'exceljs';
import { redis } from '../utils/cache';
import { prisma } from '../utils/db';
import { getFunnelData } from '../services/funnelService';
import { getParetoData } from '../services/paretoService';
import { getOverviewData } from '../services/overviewService';
import { getSupplierRanking } from '../services/supplierService';
import { getPromotionComparison } from '../services/promotionService';
import fs from 'fs';
import path from 'path';

const exportDir = path.join(process.cwd(), 'public', 'exports');

if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

export const exportWorker = new Worker(
  'export-tasks',
  async (job: any) => {
    const { taskId, filters, format } = job.data;

    try {
      await prisma.exportTask.update({
        where: { id: taskId },
        data: { status: 'processing' },
      });

      const [overview, funnel, pareto, suppliers, promotion] = await Promise.all([
        getOverviewData(filters),
        getFunnelData(filters),
        getParetoData(filters, 'category'),
        getSupplierRanking(filters),
        getPromotionComparison(filters),
      ]);

      const fileName = `export-${taskId}.${format}`;
      const filePath = path.join(exportDir, fileName);

      if (format === 'xlsx') {
        const workbook = new ExcelJS.Workbook();

        const ws1 = workbook.addWorksheet('概览');
        ws1.addRow(['指标', '值']);
        ws1.addRow(['总损耗金额', overview.summary.totalLoss]);
        ws1.addRow(['损耗率', overview.summary.lossRate + '%']);
        ws1.addRow(['临期批次数量', overview.summary.nearExpiryCount]);

        const ws2 = workbook.addWorksheet('临期漏斗');
        ws2.addRow(['阶段', '数量', '金额', '转化率']);
        funnel.stages.forEach((s) => {
          ws2.addRow([s.name, s.quantity, s.amount, (s.conversionRate * 100).toFixed(1) + '%']);
        });

        const ws3 = workbook.addWorksheet('损耗Pareto');
        ws3.addRow(['名称', '损耗金额', '损耗数量', '累计占比']);
        pareto.items.forEach((item) => {
          ws3.addRow([item.name, item.lossAmount, item.lossQty, item.cumulativePercent.toFixed(1) + '%']);
        });

        const ws4 = workbook.addWorksheet('供应商排行');
        ws4.addRow(['供应商', '损耗率', '准时率', '品质异常率', '综合评分']);
        suppliers.rankings.forEach((s) => {
          ws4.addRow([s.supplierName, s.lossRate + '%', s.onTimeDeliveryRate + '%', s.qualityIssueRate + '%', s.compositeScore]);
        });

        await workbook.xlsx.writeFile(filePath);
      } else {
        let csvContent = '';
        csvContent += '指标,值\n';
        csvContent += `总损耗金额,${overview.summary.totalLoss}\n`;
        csvContent += `损耗率,${overview.summary.lossRate}%\n`;
        fs.writeFileSync(filePath, csvContent);
      }

      const fileUrl = `/exports/${fileName}`;

      await prisma.exportTask.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          fileUrl,
          completedAt: new Date(),
        },
      });

      return { success: true, fileUrl };
    } catch (error) {
      console.error('Export worker error:', error);
      await prisma.exportTask.update({
        where: { id: taskId },
        data: { status: 'failed' },
      });
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  }
);

console.log('Export worker started');
