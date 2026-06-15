import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { works, technicians } from '$lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { addHistory } from '$lib/db/history';

export const GET: RequestHandler = async ({ url }) => {
  const published = url.searchParams.get('published');
  const technicianId = url.searchParams.get('technicianId');

  const conditions = [];
  if (published === 'true') conditions.push(eq(works.isPublished, true));
  if (published === 'false') conditions.push(eq(works.isPublished, false));
  if (technicianId) conditions.push(eq(works.technicianId, technicianId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      work: works,
      technician: { id: technicians.id, name: technicians.name, avatar: technicians.avatar }
    })
    .from(works)
    .leftJoin(technicians, eq(works.technicianId, technicians.id))
    .where(whereClause)
    .orderBy(desc(works.createdAt));

  return json(data);
};

export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const technicianId = formData.get('technicianId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const tagsRaw = formData.get('tags') as string | null;

  const imageFiles = formData.getAll('images') as File[];
  const imagePaths: string[] = [];

  const uploadDir = join(process.cwd(), 'static', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  for (const file of imageFiles) {
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${file.name.slice(file.name.lastIndexOf('.'))}`;
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);
      imagePaths.push(`/uploads/${filename}`);
    }
  }

  const tags = tagsRaw ? JSON.parse(tagsRaw) : [];

  const [result] = await db
    .insert(works)
    .values({
      technicianId,
      title,
      images: imagePaths,
      description,
      tags,
      isPublished: false
    })
    .returning();

  const tech = await db.select().from(technicians).where(eq(technicians.id, technicianId));
  const operatorName = (formData.get('operatorName') as string) ?? tech[0]?.name ?? '技师';

  await addHistory({
    operatorName,
    action: '创建',
    targetType: 'work',
    targetId: result.id,
    detail: `上传新作品：${title}`,
    metadata: {
      technician: tech[0]?.name,
      title,
      tags,
      imageCount: imagePaths.length
    }
  });

  return json(result, { status: 201 });
};

export const PUT: RequestHandler = async ({ request }) => {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const technicianId = formData.get('technicianId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const tagsRaw = formData.get('tags') as string | null;
    const existingImagesRaw = formData.get('existingImages') as string | null;

    const imageFiles = formData.getAll('images') as File[];
    const imagePaths: string[] = existingImagesRaw ? JSON.parse(existingImagesRaw) : [];

    const uploadDir = join(process.cwd(), 'static', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${file.name.slice(file.name.lastIndexOf('.'))}`;
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);
        imagePaths.push(`/uploads/${filename}`);
      }
    }

    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (technicianId) updateData.technicianId = technicianId;
    if (title) updateData.title = title;
    if (description !== undefined && description !== null) updateData.description = description || null;
    if (tagsRaw) updateData.tags = tags;
    if (existingImagesRaw || imageFiles.length > 0) updateData.images = imagePaths;

    const [result] = await db
      .update(works)
      .set(updateData)
      .where(eq(works.id, id))
      .returning();

    const tech = technicianId ? await db.select().from(technicians).where(eq(technicians.id, technicianId)) : null;
    const operatorName = (formData.get('operatorName') as string) ?? tech?.[0]?.name ?? '店长';

    await addHistory({
      operatorName,
      action: '更新',
      targetType: 'work',
      targetId: id,
      detail: `编辑作品：${title ?? result.title}`,
      metadata: {
        title: title ?? result.title,
        tags: tagsRaw ? JSON.parse(tagsRaw) : null,
        imageCount: imagePaths.length,
        technician: tech?.[0]?.name
      }
    });

    return json(result);
  }

  const body = await request.json();
  const { id, isPublished, operatorName = '店长' } = body;

  const [result] = await db
    .update(works)
    .set({
      isPublished,
      ...(isPublished ? { publishedAt: new Date() } : { publishedAt: null }),
      updatedAt: new Date()
    })
    .where(eq(works.id, id))
    .returning();

  await addHistory({
    operatorName,
    action: '更新',
    targetType: 'work',
    targetId: id,
    detail: `${isPublished ? '发布' : '下架'}作品：${result.title}`,
    metadata: {
      title: result.title,
      action: isPublished ? 'publish' : 'unpublish'
    }
  });

  return json(result);
};
