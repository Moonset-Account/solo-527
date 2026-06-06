import { e as requireAuth, f as getRouterParam, c as createError } from '../../../nitro/nitro.mjs';
import { P as Point } from '../../../_/Point.mjs';
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

const _id__get = requireAuth(async (event) => {
  const id = getRouterParam(event, "id");
  const point = await Point.findById(id);
  if (!point) {
    throw createError({
      statusCode: 404,
      message: "\u70B9\u4F4D\u4E0D\u5B58\u5728"
    });
  }
  return point;
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
