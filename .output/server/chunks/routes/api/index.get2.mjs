import { e as requireAuth, h as getQuery, i as UserRole, T as Task } from '../../nitro/nitro.mjs';
import 'jsonwebtoken';
import 'mongoose';
import 'bcryptjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@iconify/utils';
import 'consola';

const index_get = requireAuth(async (event, user) => {
  const query = getQuery(event);
  const {
    status,
    type,
    community,
    propertyCompany,
    pointId,
    startDate,
    endDate,
    isEscalated,
    page = 1,
    limit = 20
  } = query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (community) filter.community = community;
  if (propertyCompany) filter.propertyCompany = propertyCompany;
  if (pointId) filter.pointId = pointId;
  if (isEscalated !== void 0) filter.isEscalated = isEscalated === "true";
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  if (user.role === UserRole.PROPERTY) {
    filter.propertyCompany = user.propertyCompany;
  }
  if (user.role === UserRole.GRID_MEMBER) {
    filter.submitterId = user._id;
  }
  const tasks = await Task.find(filter).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).populate("pointId", "name address community");
  const total = await Task.countDocuments(filter);
  return {
    tasks,
    total,
    page: Number(page),
    limit: Number(limit)
  };
});

export { index_get as default };
//# sourceMappingURL=index.get2.mjs.map
