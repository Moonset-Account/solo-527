const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

async function getMembers(req, res) {
  try {
    const { page = 1, pageSize = 10, keyword, status, level } = req.query;
    
    const skip = (page - 1) * pageSize;
    const where = {};
    
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { phone: { contains: keyword } },
        { memberNo: { contains: keyword } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (level) {
      where.level = level;
    }
    
    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.member.count({ where }),
    ]);
    
    success(res, {
      list: members,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }, '获取成功');
  } catch (err) {
    logger.error('获取会员列表失败', { error: err.message });
    error(res, '获取会员列表失败', 500);
  }
}

async function getMemberById(req, res) {
  try {
    const { id } = req.params;
    
    const member = await prisma.member.findUnique({
      where: { id: Number(id) },
      include: {
        memberTreatments: {
          include: {
            treatment: true,
          },
        },
      },
    });
    
    if (!member) {
      return error(res, '会员不存在', 404);
    }
    
    success(res, member, '获取成功');
  } catch (err) {
    logger.error('获取会员详情失败', { error: err.message, id: req.params.id });
    error(res, '获取会员详情失败', 500);
  }
}

async function createMember(req, res) {
  try {
    const { name, phone, gender, birthday, level } = req.body;
    
    if (!name || !phone) {
      return error(res, '姓名和手机号不能为空', 400);
    }
    
    const existing = await prisma.member.findUnique({
      where: { phone },
    });
    
    if (existing) {
      return error(res, '该手机号已被使用', 400);
    }
    
    const memberNo = 'M' + Date.now().toString().slice(-8);
    
    const member = await prisma.member.create({
      data: {
        memberNo,
        name,
        phone,
        gender,
        birthday: birthday ? new Date(birthday) : null,
        level,
      },
    });
    
    await logger.operation(
      req.user?.id,
      'create',
      'member',
      member.id,
      'member',
      `创建会员: ${name}`,
      req
    );
    
    success(res, member, '创建成功', 201);
  } catch (err) {
    logger.error('创建会员失败', { error: err.message });
    error(res, '创建会员失败', 500);
  }
}

async function updateMember(req, res) {
  try {
    const { id } = req.params;
    const { name, phone, gender, birthday, level, status, avatar } = req.body;
    
    const member = await prisma.member.findUnique({
      where: { id: Number(id) },
    });
    
    if (!member) {
      return error(res, '会员不存在', 404);
    }
    
    if (phone && phone !== member.phone) {
      const existing = await prisma.member.findUnique({
        where: { phone },
      });
      
      if (existing) {
        return error(res, '该手机号已被使用', 400);
      }
    }
    
    const updated = await prisma.member.update({
      where: { id: Number(id) },
      data: {
        name,
        phone,
        gender,
        birthday: birthday ? new Date(birthday) : undefined,
        level,
        status,
        avatar,
      },
    });
    
    await logger.operation(
      req.user?.id,
      'update',
      'member',
      Number(id),
      'member',
      `更新会员信息: ${name || member.name}`,
      req
    );
    
    success(res, updated, '更新成功');
  } catch (err) {
    logger.error('更新会员失败', { error: err.message, id: req.params.id });
    error(res, '更新会员失败', 500);
  }
}

async function deleteMember(req, res) {
  try {
    const { id } = req.params;
    
    const member = await prisma.member.findUnique({
      where: { id: Number(id) },
    });
    
    if (!member) {
      return error(res, '会员不存在', 404);
    }
    
    await prisma.member.delete({
      where: { id: Number(id) },
    });
    
    await logger.operation(
      req.user?.id,
      'delete',
      'member',
      Number(id),
      'member',
      `删除会员: ${member.name}`,
      req
    );
    
    success(res, null, '删除成功');
  } catch (err) {
    logger.error('删除会员失败', { error: err.message, id: req.params.id });
    error(res, '删除会员失败', 500);
  }
}

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
};
