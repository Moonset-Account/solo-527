import { d as defineEventHandler, r as readBody, c as createError, U as User, g as generateToken, s as setCookie } from '../../../nitro/nitro.mjs';
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

const login_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;
  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: "\u7528\u6237\u540D\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A"
    });
  }
  const user = await User.findOne({ username });
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF"
    });
  }
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      message: "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF"
    });
  }
  const token = generateToken(user._id.toString(), user.role);
  setCookie(event, "auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/"
  });
  return {
    user: {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone,
      community: user.community,
      gridArea: user.gridArea,
      propertyCompany: user.propertyCompany
    },
    token
  };
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
