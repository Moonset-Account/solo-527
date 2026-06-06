import { e as requireAuth, i as UserRole, c as createError, f as getRouterParam, r as readBody, T as Task, j as TaskStatus } from '../../../../nitro/nitro.mjs';
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

const submitFix_post = requireAuth(async (event, user) => {
  var _a;
  if (user.role !== UserRole.PROPERTY) {
    throw createError({
      statusCode: 403,
      message: "\u53EA\u6709\u7269\u4E1A\u53EF\u4EE5\u63D0\u4EA4\u6574\u6539"
    });
  }
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const { afterPhotos, note } = body;
  const task = await Task.findById(id);
  if (!task) {
    throw createError({
      statusCode: 404,
      message: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
    });
  }
  if (((_a = task.assigneeId) == null ? void 0 : _a.toString()) !== user._id.toString()) {
    throw createError({
      statusCode: 403,
      message: "\u53EA\u80FD\u5904\u7406\u60A8\u8BA4\u9886\u7684\u4EFB\u52A1"
    });
  }
  if (task.status !== TaskStatus.CLAIMED && task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.REJECTED) {
    throw createError({
      statusCode: 400,
      message: "\u5F53\u524D\u4EFB\u52A1\u72B6\u6001\u65E0\u6CD5\u63D0\u4EA4\u6574\u6539"
    });
  }
  const newAfterPhotos = (afterPhotos || []).map((photo) => ({
    ...photo,
    uploadedBy: user._id,
    uploadedAt: /* @__PURE__ */ new Date()
  }));
  task.afterPhotos = [...task.afterPhotos, ...newAfterPhotos];
  task.status = TaskStatus.PENDING_REVIEW;
  task.history.push({
    status: TaskStatus.PENDING_REVIEW,
    changedBy: user._id,
    changedByName: user.name,
    changedAt: /* @__PURE__ */ new Date(),
    note: note || "\u63D0\u4EA4\u6574\u6539\u5B8C\u6210\uFF0C\u7B49\u5F85\u590D\u67E5"
  });
  await task.save();
  return task;
});

export { submitFix_post as default };
//# sourceMappingURL=submit-fix.post.mjs.map
