import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import XLSX from 'xlsx';
import dayjs from 'dayjs';

const router = Router();

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const isCustomer = req.user.role === 'CUSTOMER';
    let customerId = null;

    if (isCustomer) {
      const customer = await prisma.customer.findFirst({
        where: { email: req.user.email },
      });
      customerId = customer?.id;
    }

    const billWhere = {};
    if (customerId) billWhere.customerId = customerId;

    const [
      totalBills,
      unpaidBills,
      overdueBills,
      paidBills,
      totalReceivables,
      totalPaid,
    ] = await Promise.all([
      prisma.bill.count({ where: billWhere }),
      prisma.bill.count({ where: { ...billWhere, status: { in: ['UNPAID', 'PARTIAL_PAID'] } } }),
      prisma.bill.count({ where: { ...billWhere, status: 'OVERDUE' } }),
      prisma.bill.count({ where: { ...billWhere, status: 'PAID' } }),
      prisma.bill.aggregate({
        where: billWhere,
        _sum: { totalAmount: true },
      }),
      prisma.bill.aggregate({
        where: billWhere,
        _sum: { paidAmount: true },
      }),
    ]);

    const transactionWhere = {};
    const collectionWhere = {};
    if (customerId) {
      transactionWhere.customerId = customerId;
      collectionWhere.customerId = customerId;
    }

    const [unmatchedTransactions, pendingCollections] = isCustomer
      ? [0, 0]
      : await Promise.all([
          prisma.bankTransaction.count({ where: { ...transactionWhere, status: 'UNMATCHED' } }),
          prisma.collection.count({ where: { ...collectionWhere, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
        ]);

    res.json({
      stats: {
        totalBills,
        unpaidBills,
        overdueBills,
        paidBills,
        totalReceivables: totalReceivables._sum.totalAmount || 0,
        totalPaid: totalPaid._sum.paidAmount || 0,
        outstandingBalance: (totalReceivables._sum.totalAmount || 0) - (totalPaid._sum.paidAmount || 0),
        unmatchedTransactions,
        pendingCollections,
      },
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/collection-trend', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const month = dayjs().subtract(i, 'month').format('YYYY-MM');
      const startOfMonth = dayjs().subtract(i, 'month').startOf('month').toDate();
      const endOfMonth = dayjs().subtract(i, 'month').endOf('month').toDate();

      const [billed, collected] = await Promise.all([
        prisma.bill.aggregate({
          where: {
            billDate: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { totalAmount: true },
        }),
        prisma.payment.aggregate({
          where: {
            paymentDate: { gte: startOfMonth, lte: endOfMonth },
            status: 'SUCCESS',
          },
          _sum: { amount: true },
        }),
      ]);

      data.push({
        month,
        billed: billed._sum.totalAmount || 0,
        collected: collected._sum.amount || 0,
      });
    }

    res.json({ data });
  } catch (error) {
    console.error('获取回款趋势失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/aging', authenticate, async (req, res) => {
  try {
    const isCustomer = req.user.role === 'CUSTOMER';
    let customerId = null;

    if (isCustomer) {
      const customer = await prisma.customer.findFirst({
        where: { email: req.user.email },
      });
      customerId = customer?.id;
    }

    const now = new Date();
    const buckets = [
      { label: '0-30天', min: 0, max: 30, amount: 0, count: 0 },
      { label: '31-60天', min: 31, max: 60, amount: 0, count: 0 },
      { label: '61-90天', min: 61, max: 90, amount: 0, count: 0 },
      { label: '90天以上', min: 91, max: 9999, amount: 0, count: 0 },
    ];

    const where = {
      status: { in: ['UNPAID', 'PARTIAL_PAID', 'OVERDUE'] },
    };
    if (customerId) where.customerId = customerId;

    const bills = await prisma.bill.findMany({
      where,
      select: { balanceAmount: true, dueDate: true },
    });

    for (const bill of bills) {
      const daysOverdue = Math.floor((now - new Date(bill.dueDate)) / (1000 * 60 * 60 * 24));
      const balance = parseFloat(bill.balanceAmount);

      for (const bucket of buckets) {
        if (daysOverdue >= bucket.min && daysOverdue <= bucket.max) {
          bucket.amount += balance;
          bucket.count += 1;
          break;
        }
      }
    }

    res.json({ buckets });
  } catch (error) {
    console.error('获取账龄分析失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/export/bills', authenticate, async (req, res) => {
  try {
    const { status, customerId, startDate, endDate } = req.query;
    const isCustomer = req.user.role === 'CUSTOMER';

    const where = {};
    if (status) {
      const statuses = Array.isArray(status) ? status : status.split(',');
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }
    if (customerId && !isCustomer) where.customerId = parseInt(customerId);
    if (startDate || endDate) {
      where.billDate = {};
      if (startDate) where.billDate.gte = new Date(startDate);
      if (endDate) where.billDate.lte = new Date(endDate);
    }

    if (isCustomer) {
      const customer = await prisma.customer.findFirst({
        where: { email: req.user.email },
      });
      if (customer) {
        where.customerId = customer.id;
      }
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        customer: { select: { name: true, customerNo: true } },
      },
      orderBy: { billDate: 'desc' },
    });

    const getStatusText = (status) => {
      const map = {
        DRAFT: '草稿',
        UNPAID: '待付款',
        PARTIAL_PAID: '部分付款',
        PAID: '已付款',
        OVERDUE: '已逾期',
        WRITTEN_OFF: '已冲销',
        CANCELLED: '已取消',
      };
      return map[status] || status;
    };

    const data = bills.map(bill => ({
      '账单编号': bill.billNo,
      '客户名称': bill.customer?.name || '',
      '客户编号': bill.customer?.customerNo || '',
      '账期': bill.billPeriod,
      '账单日期': dayjs(bill.billDate).format('YYYY-MM-DD'),
      '到期日期': dayjs(bill.dueDate).format('YYYY-MM-DD'),
      '账单金额': parseFloat(bill.totalAmount),
      '已付金额': parseFloat(bill.paidAmount),
      '待收金额': parseFloat(bill.balanceAmount),
      '收费进度': bill.totalAmount > 0 ? `${((bill.paidAmount / bill.totalAmount) * 100).toFixed(1)}%` : '0%',
      '状态': getStatusText(bill.status),
      '是否逾期': new Date(bill.dueDate) < new Date() && bill.status !== 'PAID' && bill.status !== 'WRITTEN_OFF' ? '是' : '否',
      '逾期天数': (() => {
        const due = new Date(bill.dueDate);
        const now = new Date();
        if (due >= now || bill.status === 'PAID' || bill.status === 'WRITTEN_OFF') return 0;
        return Math.floor((now - due) / (1000 * 60 * 60 * 24));
      })(),
      '最近处理人': bill.lastHandler || '',
      '最近处理时间': bill.lastHandleTime ? dayjs(bill.lastHandleTime).format('YYYY-MM-DD HH:mm') : '',
      '备注': bill.remark || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '账单列表');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const fileName = `账单列表_${dayjs().format('YYYYMMDD')}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('导出账单失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/export/transactions', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { status, customerId, startDate, endDate } = req.query;

    const where = {};
    if (status) {
      const statuses = Array.isArray(status) ? status : status.split(',');
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }
    if (customerId) where.customerId = parseInt(customerId);
    if (startDate || endDate) {
      where.transDate = {};
      if (startDate) where.transDate.gte = new Date(startDate);
      if (endDate) where.transDate.lte = new Date(endDate);
    }

    const transactions = await prisma.bankTransaction.findMany({
      where,
      include: {
        customer: { select: { name: true, customerNo: true } },
      },
      orderBy: { transDate: 'desc' },
    });

    const getStatusText = (status) => {
      const map = {
        UNMATCHED: '未匹配',
        MATCHED: '已匹配',
        PARTIAL_MATCHED: '部分匹配',
        EXCESS: '超额',
      };
      return map[status] || status;
    };

    const data = transactions.map(trans => ({
      '流水号': trans.transNo,
      '客户名称': trans.customer?.name || '',
      '客户编号': trans.customer?.customerNo || '',
      '交易日期': dayjs(trans.transDate).format('YYYY-MM-DD'),
      '交易类型': trans.transType === 'INCOME' ? '收入' : '支出',
      '金额': parseFloat(trans.amount),
      '对方账户': trans.counterparty || '',
      '银行账户': trans.bankAccount || '',
      '摘要': trans.summary || '',
      '匹配状态': getStatusText(trans.status),
      '已匹配金额': parseFloat(trans.matchedAmount),
      '未匹配金额': parseFloat(trans.amount) - parseFloat(trans.matchedAmount),
      '备注': trans.remark || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '流水列表');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const fileName = `流水列表_${dayjs().format('YYYYMMDD')}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('导出流水失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/export/payments', authenticate, async (req, res) => {
  try {
    const { status, customerId, billId, startDate, endDate } = req.query;
    const isCustomer = req.user.role === 'CUSTOMER';

    const where = {};
    if (status) {
      const statuses = Array.isArray(status) ? status : status.split(',');
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }
    if (customerId && !isCustomer) where.customerId = parseInt(customerId);
    if (billId) where.billId = parseInt(billId);
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    if (isCustomer) {
      const customer = await prisma.customer.findFirst({
        where: { email: req.user.email },
      });
      if (customer) {
        where.customerId = customer.id;
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: { select: { name: true, customerNo: true } },
        bill: { select: { billNo: true, billPeriod: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const getStatusText = (status) => {
      const map = {
        PENDING: '处理中',
        SUCCESS: '成功',
        FAILED: '失败',
        REFUNDED: '已退款',
        PARTIAL_REFUNDED: '部分退款',
      };
      return map[status] || status;
    };

    const getMethodText = (method) => {
      const map = {
        BANK_TRANSFER: '银行转账',
        ALIPAY: '支付宝',
        WECHAT: '微信支付',
        CASH: '现金',
        OTHER: '其他',
      };
      return map[method] || method;
    };

    const data = payments.map(payment => ({
      '付款单号': payment.paymentNo,
      '客户名称': payment.customer?.name || '',
      '客户编号': payment.customer?.customerNo || '',
      '关联账单': payment.bill?.billNo || '',
      '账期': payment.bill?.billPeriod || '',
      '付款金额': parseFloat(payment.amount),
      '付款方式': getMethodText(payment.paymentMethod),
      '付款日期': dayjs(payment.paymentDate).format('YYYY-MM-DD'),
      '状态': getStatusText(payment.status),
      '备注': payment.remark || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '付款记录');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const fileName = `付款记录_${dayjs().format('YYYYMMDD')}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('导出付款记录失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/export/collections', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { status, customerId, priority } = req.query;

    const where = {};
    if (status) {
      const statuses = Array.isArray(status) ? status : status.split(',');
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }
    if (customerId) where.customerId = parseInt(customerId);
    if (priority) where.priority = priority;

    const collections = await prisma.collection.findMany({
      where,
      include: {
        customer: { select: { name: true, customerNo: true } },
        bill: { select: { billNo: true, billPeriod: true, totalAmount: true, balanceAmount: true } },
        assignedTo: { select: { name: true } },
        records: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const getStatusText = (status) => {
      const map = {
        PENDING: '待处理',
        IN_PROGRESS: '处理中',
        COMPLETED: '已完成',
        ESCALATED: '已升级',
      };
      return map[status] || status;
    };

    const data = collections.map(col => ({
      '催收单号': col.collectionNo,
      '客户名称': col.customer?.name || '',
      '客户编号': col.customer?.customerNo || '',
      '关联账单': col.bill?.billNo || '',
      '账期': col.bill?.billPeriod || '',
      '账单金额': col.bill ? parseFloat(col.bill.totalAmount) : 0,
      '待收金额': col.bill ? parseFloat(col.bill.balanceAmount) : 0,
      '催收金额': parseFloat(col.amount),
      '优先级': col.priority,
      '状态': getStatusText(col.status),
      '当前阶段': `第${col.currentStage}/${col.totalStages}阶段`,
      '催收次数': col.records?.length || 0,
      '负责人': col.assignedTo?.name || '',
      '计划完成日期': dayjs(col.dueDate).format('YYYY-MM-DD'),
      '备注': col.remark || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '催收记录');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const fileName = `催收记录_${dayjs().format('YYYYMMDD')}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('导出催收记录失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

export default router;
