import { e as requireAuth, f as getRouterParam, T as Task, c as createError } from '../../../nitro/nitro.mjs';
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
  const task = await Task.findById(id).populate("pointId", "name address community location binTypes contactPerson contactPhone");
  if (!task) {
    throw createError({
      statusCode: 404,
      message: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
    });
  }
  return task;
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
