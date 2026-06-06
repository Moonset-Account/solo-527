import { d as defineEventHandler, b as getCurrentUser, c as createError } from '../../../nitro/nitro.mjs';
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

const me_get = defineEventHandler(async (event) => {
  const user = await getCurrentUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "\u672A\u767B\u5F55"
    });
  }
  return {
    id: user._id,
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
    community: user.community,
    gridArea: user.gridArea,
    propertyCompany: user.propertyCompany
  };
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
