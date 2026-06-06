import { e as requireAuth, i as UserRole, c as createError, f as getRouterParam, T as Task, j as TaskStatus } from '../../../../nitro/nitro.mjs';
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

const claim_post = requireAuth(async (event, user) => {
  if (user.role !== UserRole.PROPERTY) {
    throw createError({
      statusCode: 403,
      message: "\u53EA\u6709\u7269\u4E1A\u53EF\u4EE5\u8BA4\u9886\u4EFB\u52A1"
    });
  }
  const id = getRouterParam(event, "id");
  const task = await Task.findById(id);
  if (!task) {
    throw createError({
      statusCode: 404,
      message: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
    });
  }
  if (task.propertyCompany !== user.propertyCompany) {
    throw createError({
      statusCode: 403,
      message: "\u53EA\u80FD\u8BA4\u9886\u672C\u7269\u4E1A\u516C\u53F8\u7684\u4EFB\u52A1"
    });
  }
  if (task.status !== TaskStatus.SUBMITTED && task.status !== TaskStatus.REJECTED) {
    throw createError({
      statusCode: 400,
      message: "\u5F53\u524D\u4EFB\u52A1\u72B6\u6001\u65E0\u6CD5\u8BA4\u9886"
    });
  }
  task.status = TaskStatus.CLAIMED;
  task.assigneeId = user._id;
  task.assigneeName = user.name;
  task.history.push({
    status: TaskStatus.CLAIMED,
    changedBy: user._id,
    changedByName: user.name,
    changedAt: /* @__PURE__ */ new Date(),
    note: "\u7269\u4E1A\u8BA4\u9886\u4EFB\u52A1"
  });
  await task.save();
  return task;
});

export { claim_post as default };
//# sourceMappingURL=claim.post.mjs.map
