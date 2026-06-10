const prisma = require('../utils/prisma');
const { success, error, paginate } = require('../utils/response');

async function getFacilities(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || '';
    const type = req.query.type;
    const status = req.query.status;
    const gridId = req.query.gridId ? parseInt(req.query.gridId) : undefined;

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

    if (status) {
      where.status = status;
    }

    if (gridId) {
      where.gridId = gridId;
    }

    const skip = (page - 1) * pageSize;

    const [facilities, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          grid: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.facility.count({ where }),
    ]);

    return paginate(res, facilities, total, page, pageSize);
  } catch (err) {
    next(err);
  }
}

async function getFacilityById(req, res, next) {
  try {
    const { id } = req.params;

    const facility = await prisma.facility.findUnique({
      where: { id: parseInt(id) },
      include: {
        grid: true,
      },
    });

    if (!facility) {
      return error(res, '设施不存在', 404);
    }

    return success(res, facility);
  } catch (err) {
    next(err);
  }
}

async function createFacility(req, res, next) {
  try {
    const { name, code, type, location, latitude, longitude, gridId, status, image, description } = req.body;

    if (!name || !code || !type || !location || !gridId) {
      return error(res, '必填项不能为空', 400);
    }

    const facility = await prisma.facility.create({
      data: {
        name,
        code,
        type,
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        gridId: parseInt(gridId),
        status: status || 'NORMAL',
        image,
        description,
      },
    });

    return success(res, facility, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function updateFacility(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, type, location, latitude, longitude, gridId, status, image, description } = req.body;

    const facility = await prisma.facility.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        type,
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        gridId: gridId ? parseInt(gridId) : undefined,
        status,
        image,
        description,
      },
    });

    return success(res, facility, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function deleteFacility(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.facility.delete({
      where: { id: parseInt(id) },
    });

    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function updateFacilityStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return error(res, '状态不能为空', 400);
    }

    const facility = await prisma.facility.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    return success(res, facility, '状态更新成功');
  } catch (err) {
    next(err);
  }
}

async function getFacilityStatistics(req, res, next) {
  try {
    const [totalCount, normalCount, damagedCount, maintenanceCount] = await Promise.all([
      prisma.facility.count(),
      prisma.facility.count({ where: { status: 'NORMAL' } }),
      prisma.facility.count({ where: { status: 'DAMAGED' } }),
      prisma.facility.count({ where: { status: 'MAINTENANCE' } }),
    ]);

    const typeStats = await prisma.facility.groupBy({
      by: ['type'],
      _count: true,
    });

    return success(res, {
      total: totalCount,
      normal: normalCount,
      damaged: damagedCount,
      maintenance: maintenanceCount,
      byType: typeStats,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  updateFacilityStatus,
  getFacilityStatistics,
};
