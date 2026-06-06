import { e as requireAuth, f as getRouterParam, r as readBody, T as Task, c as createError, j as TaskStatus, U as User, i as UserRole } from '../../../../nitro/nitro.mjs';
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

const escalate_post = requireAuth(async (event, user) => {
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
  if (task.isEscalated) {
    throw createError({
      statusCode: 400,
      message: "\u4EFB\u52A1\u5DF2\u5347\u7EA7"
    });
  }
  task.isEscalated = true;
  task.escalationReason = reason || "\u903E\u671F\u672A\u5904\u7406";
  task.escalationTime = /* @__PURE__ */ new Date();
  task.status = TaskStatus.ESCALATED;
  await User.findOne({
    role: UserRole.STREET_ADMIN,
    community: task.community
  });
  task.history.push({
    status: TaskStatus.ESCALATED,
    changedBy: user._id,
    changedByName: user.name,
    changedAt: /* @__PURE__ */ new Date(),
    note: `\u4EFB\u52A1\u5347\u7EA7\uFF1A${reason || "\u903E\u671F\u672A\u5904\u7406"}\uFF0C\u5DF2\u901A\u77E5\u7F51\u683C\u8D1F\u8D23\u4EBA`
  });
  await task.save();
  return task;
});

export { escalate_post as default };
//# sourceMappingURL=escalate.post.mjs.map
