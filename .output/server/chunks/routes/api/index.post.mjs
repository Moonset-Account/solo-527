import { e as requireAuth, i as UserRole, c as createError, r as readBody, u as useRuntimeConfig, l as generateTaskNumber, T as Task, j as TaskStatus } from '../../nitro/nitro.mjs';
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

const index_post = requireAuth(async (event, user) => {
  if (user.role !== UserRole.GRID_MEMBER && user.role !== UserRole.STREET_ADMIN) {
    throw createError({
      statusCode: 403,
      message: "\u53EA\u6709\u7F51\u683C\u5458\u548C\u8857\u9053\u7BA1\u7406\u5458\u53EF\u4EE5\u63D0\u4EA4\u4EFB\u52A1"
    });
  }
  const body = await readBody(event);
  const { pointId, type, description, beforePhotos } = body;
  if (!pointId || !type || !description) {
    throw createError({
      statusCode: 400,
      message: "\u70B9\u4F4D\u3001\u7C7B\u578B\u548C\u63CF\u8FF0\u4E0D\u80FD\u4E3A\u7A7A"
    });
  }
  const point = await Point.findById(pointId);
  if (!point) {
    throw createError({
      statusCode: 404,
      message: "\u70B9\u4F4D\u4E0D\u5B58\u5728"
    });
  }
  const config = useRuntimeConfig();
  const deadlineHours = Number(config.public.taskDeadlineHours) || 24;
  const deadline = /* @__PURE__ */ new Date();
  deadline.setHours(deadline.getHours() + deadlineHours);
  const taskNumber = generateTaskNumber();
  const photosWithMetadata = (beforePhotos || []).map((photo) => ({
    ...photo,
    uploadedBy: user._id,
    uploadedAt: /* @__PURE__ */ new Date()
  }));
  const task = await Task.create({
    taskNumber,
    type,
    pointId: point._id,
    pointName: point.name,
    community: point.community,
    submitterId: user._id,
    submitterName: user.name,
    description,
    beforePhotos: photosWithMetadata,
    status: TaskStatus.SUBMITTED,
    propertyCompany: point.propertyCompany,
    deadline,
    history: [{
      status: TaskStatus.SUBMITTED,
      changedBy: user._id,
      changedByName: user.name,
      changedAt: /* @__PURE__ */ new Date(),
      note: "\u4EFB\u52A1\u63D0\u4EA4"
    }]
  });
  return task;
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
