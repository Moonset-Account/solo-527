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

const review_post = requireAuth(async (event, user) => {
  if (user.role !== UserRole.STREET_ADMIN) {
    throw createError({
      statusCode: 403,
      message: "\u53EA\u6709\u8857\u9053\u7BA1\u7406\u5458\u53EF\u4EE5\u590D\u67E5"
    });
  }
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const { result, reason, photos } = body;
  if (!result || !["pass", "fail"].includes(result)) {
    throw createError({
      statusCode: 400,
      message: "\u590D\u67E5\u7ED3\u679C\u5FC5\u987B\u662F pass \u6216 fail"
    });
  }
  const task = await Task.findById(id);
  if (!task) {
    throw createError({
      statusCode: 404,
      message: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
    });
  }
  if (task.status !== TaskStatus.PENDING_REVIEW) {
    throw createError({
      statusCode: 400,
      message: "\u53EA\u6709\u5F85\u590D\u67E5\u7684\u4EFB\u52A1\u53EF\u4EE5\u8FDB\u884C\u590D\u67E5"
    });
  }
  const reviewPhotos = (photos || []).map((photo) => ({
    ...photo,
    uploadedBy: user._id,
    uploadedAt: /* @__PURE__ */ new Date()
  }));
  const reviewRecord = {
    reviewerId: user._id,
    reviewerName: user.name,
    result,
    reason,
    photos: reviewPhotos,
    reviewedAt: /* @__PURE__ */ new Date()
  };
  task.reviewRecords.push(reviewRecord);
  if (result === "pass") {
    task.status = TaskStatus.CLOSED;
    task.history.push({
      status: TaskStatus.CLOSED,
      changedBy: user._id,
      changedByName: user.name,
      changedAt: /* @__PURE__ */ new Date(),
      note: "\u590D\u67E5\u901A\u8FC7\uFF0C\u4EFB\u52A1\u5173\u95ED"
    });
  } else {
    task.status = TaskStatus.REJECTED;
    task.rejectReason = reason;
    task.history.push({
      status: TaskStatus.REJECTED,
      changedBy: user._id,
      changedByName: user.name,
      changedAt: /* @__PURE__ */ new Date(),
      note: `\u590D\u67E5\u4E0D\u901A\u8FC7\uFF1A${reason || "\u9700\u8981\u91CD\u65B0\u6574\u6539"}`
    });
  }
  await task.save();
  return task;
});

export { review_post as default };
//# sourceMappingURL=review.post.mjs.map
