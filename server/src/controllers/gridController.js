const prisma = require('../utils/prisma');
const { success, error, paginate } = require('../utils/response');

async function getGrids(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || '';

    const where = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [grids, total] = await Promise.all([
      prisma.grid.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          _count: {
            select: { users: true, events: true, facilities: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.grid.count({ where }),
    ]);

    return paginate(res, grids, total, page, pageSize);
  } catch (err) {
    next(err);
  }
}

async function getAllGrids(req, res, next) {
  try {
    const grids = await prisma.grid.findMany({
      orderBy: { name: 'asc' },
    });

    return success(res, grids);
  } catch (err) {
    next(err);
  }
}

async function getGridById(req, res, next) {
  try {
    const { id } = req.params;

    const grid = await prisma.grid.findUnique({
      where: { id: parseInt(id) },
      include: {
        users: {
          select: { id: true, name: true, username: true },
        },
        _count: {
          select: { events: true, facilities: true },
        },
      },
    });

    if (!grid) {
      return error(res, '网格不存在', 404);
    }

    return success(res, grid);
  } catch (err) {
    next(err);
  }
}

async function createGrid(req, res, next) {
  try {
    const { name, code, area, description } = req.body;

    if (!name || !code) {
      return error(res, '网格名称和编码不能为空', 400);
    }

    const existingGrid = await prisma.grid.findUnique({
      where: { code },
    });

    if (existingGrid) {
      return error(res, '网格编码已存在', 400);
    }

    const grid = await prisma.grid.create({
      data: {
        name,
        code,
        area,
        description,
      },
    });

    return success(res, grid, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function updateGrid(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, area, description } = req.body;

    const grid = await prisma.grid.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        area,
        description,
      },
    });

    return success(res, grid, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function deleteGrid(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.grid.delete({
      where: { id: parseInt(id) },
    });

    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getGrids,
  getAllGrids,
  getGridById,
  createGrid,
  updateGrid,
  deleteGrid,
};
