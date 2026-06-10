const prisma = require('../utils/prisma');
const { success, error, paginate } = require('../utils/response');

async function getDepartments(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || '';
    const type = req.query.type;

    const where = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
      ];
    }

    if (type) {
      where.type = type;
    }

    const skip = (page - 1) * pageSize;

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          _count: {
            select: { events: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.department.count({ where }),
    ]);

    return paginate(res, departments, total, page, pageSize);
  } catch (err) {
    next(err);
  }
}

async function getAllDepartments(req, res, next) {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });

    return success(res, departments);
  } catch (err) {
    next(err);
  }
}

async function getDepartmentById(req, res, next) {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id: parseInt(id) },
    });

    if (!department) {
      return error(res, '部门不存在', 404);
    }

    return success(res, department);
  } catch (err) {
    next(err);
  }
}

async function createDepartment(req, res, next) {
  try {
    const { name, code, type, contact, phone } = req.body;

    if (!name || !code) {
      return error(res, '部门名称和编码不能为空', 400);
    }

    const existingDepartment = await prisma.department.findUnique({
      where: { code },
    });

    if (existingDepartment) {
      return error(res, '部门编码已存在', 400);
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        type,
        contact,
        phone,
      },
    });

    return success(res, department, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, type, contact, phone } = req.body;

    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        type,
        contact,
        phone,
      },
    });

    return success(res, department, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function deleteDepartment(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.department.delete({
      where: { id: parseInt(id) },
    });

    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDepartments,
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
