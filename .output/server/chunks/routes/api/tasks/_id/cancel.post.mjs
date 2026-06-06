import { e as requireAuth, f as getRouterParam, r as readBody, T as Task, c as createError, i as UserRole, j as TaskStatus } from '../../../../nitro/nitro.mjs';
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

const cancel_post = requireAuth(async (event, user) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const { reason } = body;
  const task = await Task.findById(id);
  if (!task) {
    throw createError({
      statusCode: 404,
      message: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
    });
  }
  if (task.submitterId.toString() !== user._id.toString() && user.role !== UserRole.STREET_ADMIN) {
    throw createError({
      statusCode: 403,
      message: "\u53EA\u80FD\u64A4\u56DE\u81EA\u5DF1\u63D0\u4EA4\u7684\u4EFB\u52A1"
    });
  }
  if (task.status === TaskStatus.CLOSED || task.status === TaskStatus.CANCELLED) {
    throw createError({
      statusCode: 400,
      message: "\u5F53\u524D\u4EFB\u52A1\u72B6\u6001\u65E0\u6CD5\u64A4\u56DE"
    });
  }
  task.status = TaskStatus.CANCELLED;
  task.history.push({
    status: TaskStatus.CANCELLED,
    changedBy: user._id,
    changedByName: user.name,
    changedAt: /* @__PURE__ */ new Date(),
    note: `\u4EFB\u52A1\u64A4\u56DE\uFF1A${reason || "\u65E0\u539F\u56E0"}`
  });
  await task.save();
  return task;
});

export { cancel_post as default };
//# sourceMappingURL=cancel.post.mjs.map
