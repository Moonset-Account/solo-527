const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const approvals = await prisma.approval.findMany({
      include: { approver: { select: { id: true, name: true } }, lossReports: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { approverId, status, comment, lossReportIds } = req.body;

    const results = {
      success: [],
      failed: [],
    };

    for (const reportId of lossReportIds) {
      try {
        const report = await prisma.lossReport.findUnique({ where: { id: reportId } });
        if (!report) {
          results.failed.push({ id: reportId, reason: '报损记录不存在' });
          continue;
        }
        if (report.approvalStatus !== 'PENDING') {
          results.failed.push({ id: reportId, reason: `当前状态为 ${report.approvalStatus}，无法审批` });
          continue;
        }
        results.success.push(reportId);
      } catch (err) {
        results.failed.push({ id: reportId, reason: err.message });
      }
    }

    if (results.success.length > 0) {
      const approval = await prisma.approval.create({
        data: {
          approverId,
          status,
          comment,
          batchApproval: results.success.length > 1,
          batchItems: JSON.stringify(results),
          lossReports: {
            connect: results.success.map((id) => ({ id })),
          },
        },
      });

      await prisma.lossReport.updateMany({
        where: { id: { in: results.success } },
        data: { approvalStatus: status },
      });

      res.json({ approval, results });
    } else {
      res.status(400).json({ error: '没有可审批的记录', results });
    }
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
