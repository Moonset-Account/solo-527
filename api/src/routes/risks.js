import { Router } from 'express';
import ExcelJS from 'exceljs';
import WorkOrder from '../models/WorkOrder.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res) => {
  const { riskType, days, status, keyword, page = 1, limit = 50 } = req.query;
  const q = { status: { $nin: ['completed', 'cancelled'] } };
  if (status) q.status = status;

  if (keyword) {
    q.$or = [
      { orderNo: { $regex: keyword, $options: 'i' } },
      { productName: { $regex: keyword, $options: 'i' } }
    ];
  }

  const list = await WorkOrder.find(q).sort({ plannedEndDate: 1 })
    .populate('ownerId', 'name').lean();

  const now = new Date();
  let filtered = list.map(o => {
    const daysLeft = Math.ceil((new Date(o.plannedEndDate) - now) / (1000 * 60 * 60 * 24));
    return { ...o, daysLeft };
  });

  if (riskType === 'delivery') {
    const d = Number(days) || 3;
    filtered = filtered.filter(o => o.daysLeft <= d);
  } else if (riskType === 'material') {
    filtered = filtered.filter(o => o.materialStatus !== 'ready');
  } else if (riskType === 'equipment') {
    filtered = filtered.filter(o => o.equipmentDown);
  } else if (riskType === 'quality') {
    filtered = filtered.filter(o => o.qualityPassRate > 0 && o.qualityPassRate < 90);
  }

  const total = filtered.length;
  const skip = (Number(page) - 1) * Number(limit);
  const pageList = filtered.slice(skip, skip + Number(limit));
  res.json({ list: pageList, total, page: Number(page), limit: Number(limit) });
});

router.get('/export', requireRole('admin', 'planner'), async (req, res) => {
  const { riskType, days } = req.query;
  const q = { status: { $nin: ['completed', 'cancelled'] } };
  const list = await WorkOrder.find(q).sort({ plannedEndDate: 1 }).populate('ownerId', 'name').lean();
  const now = new Date();
  let data = list.map(o => {
    const daysLeft = Math.ceil((new Date(o.plannedEndDate) - now) / (1000 * 60 * 60 * 24));
    return { ...o, daysLeft };
  });
  if (riskType === 'delivery') {
    const d = Number(days) || 3;
    data = data.filter(o => o.daysLeft <= d);
  } else if (riskType === 'material') {
    data = data.filter(o => o.materialStatus !== 'ready');
  } else if (riskType === 'equipment') {
    data = data.filter(o => o.equipmentDown);
  } else if (riskType === 'quality') {
    data = data.filter(o => o.qualityPassRate > 0 && o.qualityPassRate < 90);
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('交期风险清单');
  ws.columns = [
    { header: '工单号', key: 'orderNo', width: 18 },
    { header: '产品名称', key: 'productName', width: 22 },
    { header: '数量', key: 'quantity', width: 10 },
    { header: '优先级', key: 'priority', width: 10 },
    { header: '状态', key: 'status', width: 14 },
    { header: '计划完成日期', key: 'plannedEndDate', width: 18 },
    { header: '剩余天数', key: 'daysLeft', width: 10 },
    { header: '责任人', key: 'owner', width: 12 },
    { header: '物料状态', key: 'materialStatus', width: 12 },
    { header: '设备停机', key: 'equipmentDown', width: 10 },
    { header: '合格率', key: 'qualityPassRate', width: 10 },
    { header: '风险提示', key: 'riskFlags', width: 30 },
    { header: '备注', key: 'remark', width: 30 }
  ];
  data.forEach(o => {
    ws.addRow({
      orderNo: o.orderNo,
      productName: o.productName,
      quantity: o.quantity,
      priority: o.priority,
      status: o.status,
      plannedEndDate: new Date(o.plannedEndDate).toLocaleDateString('zh-CN'),
      daysLeft: o.daysLeft,
      owner: o.ownerId?.name || '',
      materialStatus: o.materialStatus,
      equipmentDown: o.equipmentDown ? '是' : '否',
      qualityPassRate: (o.qualityPassRate || 0) + '%',
      riskFlags: (o.riskFlags || []).join('、'),
      remark: o.remark || ''
    });
  });
  ws.getRow(1).font = { bold: true };
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=risk-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
});

export default router;
