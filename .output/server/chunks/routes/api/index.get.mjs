import { e as requireAuth, h as getQuery } from '../../nitro/nitro.mjs';
import { P as Point } from '../../_/Point.mjs';
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

const index_get = requireAuth(async (event) => {
  const query = getQuery(event);
  const { community, status, page = 1, limit = 50 } = query;
  const filter = {};
  if (community) filter.community = community;
  if (status) filter.status = status;
  const points = await Point.find(filter).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
  const total = await Point.countDocuments(filter);
  return {
    points,
    total,
    page: Number(page),
    limit: Number(limit)
  };
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
