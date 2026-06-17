const express = require('express');
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/loss-details', async (req, res) => {
  try {
    const { storeId, startDate, endDate, lossReasonId, ingredientId } = req.query;
    const where = {};
    if (storeId) where.storeId = parseInt(storeId);
    if (lossReasonId) where.lossReasonId = parseInt(lossReasonId);
    if (startDate || endDate) {
      where.reportTime = {};
      if (startDate) where.reportTime.gte = new Date(startDate);
      if (endDate) where.reportTime.lte = new Date(endDate);
    }
    if (ingredientId) {
      where.ingredients = { some: { ingredientId: parseInt(ingredientId) } };
    }

    const reports = await prisma.lossReport.findMany({
      where,
      include: {
        store: true,
        batch: true,
        lossReason: true,
        ingredients: { include: { ingredient: true } },
      },
      orderBy: { reportTime: 'desc' },
    });

    const rows = [];
    reports.forEach((report) => {
      report.ingredients.forEach((ing) => {
        if (ingredientId && ing.ingredientId !== parseInt(ingredientId)) return;
        rows.push({
          报损单号: report.reportNo,
          门店: report.store?.name,
          报损时间: new Date(report.reportTime).toLocaleString('zh-CN'),
          产品批次: report.batch?.batchNo || '-',
          报损原因: report.lossReason?.name,
          食材名称: ing.ingredient?.name,
          损耗数量: ing.quantity,
          单位: ing.unit,
          单价: ing.unitPrice,
          损耗金额: ing.totalValue,
          上报人: report.reporter || '-',
          审批状态: report.approvalStatus,
          备注: report.description || '-',
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 12 },
      { wch: 10 }, { wch: 10 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, '食材损耗明细');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const fileName = `损耗明细_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '导出失败' });
  }
});

module.exports = router;
