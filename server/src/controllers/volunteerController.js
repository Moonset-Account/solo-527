const prisma = require('../utils/prisma');
const { success, error, paginate } = require('../utils/response');

async function getVolunteerServices(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const eventId = req.query.eventId ? parseInt(req.query.eventId) : undefined;
    const volunteerName = req.query.volunteerName || '';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const where = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (volunteerName) {
      where.volunteerName = { contains: volunteerName };
    }

    if (startDate || endDate) {
      where.serviceDate = {};
      if (startDate) {
        where.serviceDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.serviceDate.lte = new Date(endDate + ' 23:59:59');
      }
    }

    const skip = (page - 1) * pageSize;

    const [services, total] = await Promise.all([
      prisma.volunteerService.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          event: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.volunteerService.count({ where }),
    ]);

    return paginate(res, services, total, page, pageSize);
  } catch (err) {
    next(err);
  }
}

async function getVolunteerServiceById(req, res, next) {
  try {
    const { id } = req.params;

    const service = await prisma.volunteerService.findUnique({
      where: { id: parseInt(id) },
      include: {
        event: true,
      },
    });

    if (!service) {
      return error(res, '志愿服务记录不存在', 404);
    }

    return success(res, service);
  } catch (err) {
    next(err);
  }
}

async function createVolunteerService(req, res, next) {
  try {
    const { eventId, volunteerName, volunteerPhone, serviceHours, serviceDate, description } = req.body;

    if (!eventId || !volunteerName || !volunteerPhone || !serviceHours || !serviceDate) {
      return error(res, '必填项不能为空', 400);
    }

    const service = await prisma.volunteerService.create({
      data: {
        eventId: parseInt(eventId),
        volunteerName,
        volunteerPhone,
        serviceHours: parseFloat(serviceHours),
        serviceDate: new Date(serviceDate),
        description,
      },
    });

    return success(res, service, '创建成功');
  } catch (err) {
    next(err);
  }
}

async function updateVolunteerService(req, res, next) {
  try {
    const { id } = req.params;
    const { volunteerName, volunteerPhone, serviceHours, serviceDate, description } = req.body;

    const service = await prisma.volunteerService.update({
      where: { id: parseInt(id) },
      data: {
        volunteerName,
        volunteerPhone,
        serviceHours: serviceHours ? parseFloat(serviceHours) : undefined,
        serviceDate: serviceDate ? new Date(serviceDate) : undefined,
        description,
      },
    });

    return success(res, service, '更新成功');
  } catch (err) {
    next(err);
  }
}

async function deleteVolunteerService(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.volunteerService.delete({
      where: { id: parseInt(id) },
    });

    return success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
}

async function getVolunteerStatistics(req, res, next) {
  try {
    const totalServices = await prisma.volunteerService.count();
    const totalHours = await prisma.volunteerService.aggregate({
      _sum: { serviceHours: true },
    });

    return success(res, {
      totalServices,
      totalHours: totalHours._sum.serviceHours || 0,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getVolunteerServices,
  getVolunteerServiceById,
  createVolunteerService,
  updateVolunteerService,
  deleteVolunteerService,
  getVolunteerStatistics,
};
