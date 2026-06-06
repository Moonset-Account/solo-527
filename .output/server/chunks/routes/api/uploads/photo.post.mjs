import { e as requireAuth, n as readFormData, c as createError } from '../../../nitro/nitro.mjs';
import { writeFile } from 'fs/promises';
import path from 'path';
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

const photo_post = requireAuth(async (event) => {
  const formData = await readFormData(event);
  const file = formData.get("file");
  if (!file) {
    throw createError({
      statusCode: 400,
      message: "\u8BF7\u9009\u62E9\u6587\u4EF6"
    });
  }
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${file.name}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);
  const url = `/uploads/${filename}`;
  return {
    url,
    name: file.name,
    size: file.size
  };
});

export { photo_post as default };
//# sourceMappingURL=photo.post.mjs.map
