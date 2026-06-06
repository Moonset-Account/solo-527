import { d as defineEventHandler, a as deleteCookie } from '../../../nitro/nitro.mjs';
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

const logout_post = defineEventHandler(async (event) => {
  deleteCookie(event, "auth_token");
  return { success: true };
});

export { logout_post as default };
//# sourceMappingURL=logout.post.mjs.map
