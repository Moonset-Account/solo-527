const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

async function getMemberTreatments(req, res) {
  try {
    const { page = 1, pageSize = 10, memberId, treatmentId, status } = req.query;
    
    const skip = (page - 1) * pageSize;
    const where = {};
    
    if (memberId) {
      where.memberId = Number(memberId);
    }
    
    if (treatmentId) {
      where.treatmentId = Number(treatmentId);
    }
    
    if (status) {
      where.status = status;
    }
    
    const [memberTreatments, total] = await Promise.all([
      prisma.memberTreatment.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        include: {
          member: {
            select: { id: true, name: true, phone: true, memberNo: true },
          },
          treatment: {
            select: { id: true, name: true, category: true, price: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.memberTreatment.count({ where }),
    ]);
    
    success(res, {
      list: memberTreatments,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }, '获取成功');
  } catch (err) {
    logger.error('获取会员疗程列表失败', { error: err.message });
    error(res, '获取会员疗程列表失败', 500);
  }
}

async function getMemberTreatmentById(req, res) {
  try {
    const { id } = req.params;
    
    const memberTreatment = await prisma.memberTreatment.findUnique({
      where: { id: Number(id) },
      include: {
        member: true,
        treatment: true,
      },
    });
    
    if (!memberTreatment) {
      return error(res, '会员疗程记录不存在', 404);
    }
    
    success(res, memberTreatment, '获取成功');
  } catch (err) {
    logger.error('获取会员疗程详情失败', { error: err.message, id: req.params.id });
    error(res, '获取会员疗程详情失败', 500);
  }
}

async function purchaseTreatment(req, res) {
  try {
    const { memberId, treatmentId, totalSessions, purchasePrice, purchaseDate, expireDate, consultantId } = req.body;
    
    if (!memberId || !treatmentId) {
      return error(res, '会员ID和疗程ID不能为空', 400);
    }
    
    const member = await prisma.member.findUnique({
      where: { id: Number(memberId) },
    });
    
    if (!member) {
      return error(res, '会员不存在', 404);
    }
    
    const treatment = await prisma.treatment.findUnique({
      where: { id: Number(treatmentId) },
    });
    
    if (!treatment) {
      return error(res, '疗程不存在', 404);
    }
    
    const sessions = totalSessions || treatment.totalSessions || 1;
    const price = purchasePrice || treatment.price;
    
    let expire = null;
    if (expireDate) {
      expire = new Date(expireDate);
    } else if (treatment.validDays) {
      expire = new Date();
      expire.setDate(expire.getDate() + treatment.validDays);
    }
    
    const memberTreatment = await prisma.memberTreatment.create({
      data: {
        memberId: Number(memberId),
        treatmentId: Number(treatmentId),
        totalSessions: Number(sessions),
        usedSessions: 0,
        remainingSessions: Number(sessions),
        purchasePrice: Number(price),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        expireDate: expire,
        consultantId: consultantId ? Number(consultantId) : null,
      },
      include: {
        treatment: true,
      },
    });
    
    await logger.operation(
      req.user?.id,
      'purchase',
      'memberTreatment',
      memberTreatment.id,
      'memberTreatment',
      `会员购买疗程: ${treatment.name}`,
      req
    );
    
    success(res, memberTreatment, '购买成功', 201);
  } catch (err) {
    logger.error('购买疗程失败', { error: err.message });
    error(res, '购买疗程失败', 500);
  }
}

async function deductSessions(req, res) {
  try {
    const { id } = req.params;
    const { sessions = 1, remark } = req.body;
    
    const memberTreatment = await prisma.memberTreatment.findUnique({
      where: { id: Number(id) },
      include: {
        treatment: true,
        member: true,
      },
    });
    
    if (!memberTreatment) {
      return error(res, '会员疗程记录不存在', 404);
    }
    
    if (memberTreatment.status !== 'active') {
      return error(res, '该疗程已失效', 400);
    }
    
    if (memberTreatment.remainingSessions < sessions) {
      return error(res, '剩余次数不足', 400);
    }
    
    const updated = await prisma.memberTreatment.update({
      where: { id: Number(id) },
      data: {
        usedSessions: { increment: Number(sessions) },
        remainingSessions: { decrement: Number(sessions) },
      },
      include: {
        treatment: true,
      },
    });
    
    await logger.operation(
      req.user?.id,
      'deduct',
      'memberTreatment',
      Number(id),
      'memberTreatment',
      `扣减疗程次数: ${memberTreatment.treatment.name}, 扣减${sessions}次`,
      req
    );
    
    success(res, updated, '扣减成功');
  } catch (err) {
    logger.error('扣减次数失败', { error: err.message, id: req.params.id });
    error(res, '扣减次数失败', 500);
  }
}

async function getRemainingSessions(req, res) {
  try {
    const { memberId, treatmentId } = req.query;
    
    if (!memberId) {
      return error(res, '会员ID不能为空', 400);
    }
    
    const where = {
      memberId: Number(memberId),
      status: 'active',
    };
    
    if (treatmentId) {
      where.treatmentId = Number(treatmentId);
    }
    
    const memberTreatments = await prisma.memberTreatment.findMany({
      where,
      include: {
        treatment: {
          select: { id: true, name: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const totalRemaining = memberTreatments.reduce((sum, mt) => sum + mt.remainingSessions, 0);
    
    success(res, {
      list: memberTreatments,
      totalRemaining,
    }, '获取成功');
  } catch (err) {
    logger.error('查询剩余次数失败', { error: err.message });
    error(res, '查询剩余次数失败', 500);
  }
}

async function updateMemberTreatment(req, res) {
  try {
    const { id } = req.params;
    const { status, expireDate, consultantId } = req.body;
    
    const memberTreatment = await prisma.memberTreatment.findUnique({
      where: { id: Number(id) },
    });
    
    if (!memberTreatment) {
      return error(res, '会员疗程记录不存在', 404);
    }
    
    const updated = await prisma.memberTreatment.update({
      where: { id: Number(id) },
      data: {
        status,
        expireDate: expireDate ? new Date(expireDate) : undefined,
        consultantId: consultantId !== undefined ? (consultantId ? Number(consultantId) : null) : undefined,
      },
    });
    
    await logger.operation(
      req.user?.id,
      'update',
      'memberTreatment',
      Number(id),
      'memberTreatment',
      '更新会员疗程记录',
      req
    );
    
    success(res, updated, '更新成功');
  } catch (err) {
    logger.error('更新会员疗程失败', { error: err.message, id: req.params.id });
    error(res, '更新会员疗程失败', 500);
  }
}

module.exports = {
  getMemberTreatments,
  getMemberTreatmentById,
  purchaseTreatment,
  deductSessions,
  getRemainingSessions,
  updateMemberTreatment,
};
