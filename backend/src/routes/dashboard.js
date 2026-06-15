import express from 'express';
import prisma from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const totalProperties = await prisma.property.count();
  const vacantProperties = await prisma.property.count({ where: { status: 'VACANT' } });
  const occupiedProperties = await prisma.property.count({ where: { status: 'OCCUPIED' } });
  const processingProperties = await prisma.property.count({ where: { status: 'PROCESSING' } });
  const anomalousProperties = await prisma.property.count({ where: { status: 'ANOMALOUS' } });

  const totalContracts = await prisma.contract.count();
  const pendingReview = await prisma.contract.count({ where: { reviewStatus: 'PENDING_REVIEW' } });
  const reviewing = await prisma.contract.count({ where: { reviewStatus: 'REVIEWING' } });
  const signing = await prisma.contract.count({ where: { signStatus: 'SIGNING' } });
  const signed = await prisma.contract.count({ where: { signStatus: 'SIGNED' } });
  const contractAnomalous = await prisma.contract.count({ where: { signStatus: 'ANOMALOUS' } });

  const overdueBills = await prisma.bill.count({ where: { status: 'OVERDUE' } });
  const pendingBills = await prisma.bill.count({ where: { status: 'PENDING' } });

  const openTodos = await prisma.todo.count({ where: { status: 'OPEN' } });
  const inProgressTodos = await prisma.todo.count({ where: { status: 'IN_PROGRESS' } });
  const overdueRentTodos = await prisma.todo.count({ where: { sourceType: 'OVERDUE_RENT', status: { not: 'CLOSED' } } });

  const recentViewings = await prisma.viewing.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { tenant: true, property: true },
  });

  const recentContracts = await prisma.contract.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: { tenant: true, property: true },
  });

  res.json({
    property: { total: totalProperties, vacant: vacantProperties, occupied: occupiedProperties, processing: processingProperties, anomalous: anomalousProperties, vacancyRate: totalProperties ? ((vacantProperties / totalProperties) * 100).toFixed(1) : 0 },
    contract: { total: totalContracts, pendingReview, reviewing, signing, signed, anomalous: contractAnomalous },
    bill: { overdue: overdueBills, pending: pendingBills },
    todo: { open: openTodos, inProgress: inProgressTodos, overdueRent: overdueRentTodos },
    recentViewings,
    recentContracts,
  });
});

export default router;
