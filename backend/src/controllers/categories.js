import prisma from '../utils/prisma.js';
import { success, fail, notFound, paginate } from '../utils/response.js';

export async function getCategories(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const keyword = req.query.keyword || '';
    const { parentId, isActive } = req.query;

    const where = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
      ];
    }
    if (parentId !== undefined) {
      where.parentId = parentId === 'null' || parentId === '' ? null : Number(parentId);
    }
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const total = await prisma.category.count({ where });
    const list = await prisma.category.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        parent: { select: { id: true, name: true, code: true } },
        _count: {
          select: { children: true, products: true },
        },
      },
    });

    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error('getCategories error:', err);
    return fail(res, '获取分类列表失败');
  }
}

export async function getCategoryById(req, res) {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: {
        parent: { select: { id: true, name: true, code: true } },
        children: {
          select: { id: true, name: true, code: true, sortOrder: true, isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) return notFound(res, '分类不存在');
    return success(res, category);
  } catch (err) {
    console.error('getCategoryById error:', err);
    return fail(res, '获取分类详情失败');
  }
}

export async function getCategoryTree(req, res) {
  try {
    const { includeInactive } = req.query;
    const where = {};
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    const allCategories = await prisma.category.findMany({
      where,
      include: {
        _count: { select: { products: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    const map = new Map();
    const roots = [];

    for (const cat of allCategories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of allCategories) {
      const node = map.get(cat.id);
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }

    function sortTree(nodes) {
      nodes.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.id - b.id;
      });
      for (const node of nodes) {
        if (node.children.length > 0) sortTree(node.children);
      }
    }
    sortTree(roots);

    const totalCount = allCategories.length;
    const productCount = allCategories.reduce(
      (sum, c) => sum + c._count.products, 0
    );

    return success(res, {
      tree: roots,
      totalCount,
      productCount,
    });
  } catch (err) {
    console.error('getCategoryTree error:', err);
    return fail(res, '获取分类树失败');
  }
}

export async function createCategory(req, res) {
  try {
    const { code, name, parentId, sortOrder, isActive } = req.body;

    if (!code || !name) {
      return fail(res, '请填写必填字段（编码、名称）');
    }

    const codeExists = await prisma.category.findUnique({ where: { code } });
    if (codeExists) return fail(res, '分类编码已存在');

    const nameExists = await prisma.category.findUnique({ where: { name } });
    if (nameExists) return fail(res, '分类名称已存在');

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: Number(parentId) } });
      if (!parent) return fail(res, '父分类不存在');
    }

    const data = {
      code,
      name,
      parentId: parentId ? Number(parentId) : null,
      sortOrder: sortOrder ?? 0,
      isActive: isActive !== undefined ? isActive : true,
    };

    const category = await prisma.category.create({
      data,
      include: {
        parent: { select: { id: true, name: true } },
      },
    });

    return success(res, category, '创建成功', 201);
  } catch (err) {
    console.error('createCategory error:', err);
    return fail(res, '创建分类失败');
  }
}

export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { code, name, parentId, sortOrder, isActive } = req.body;

    const category = await prisma.category.findUnique({ where: { id: Number(id) } });
    if (!category) return notFound(res, '分类不存在');

    if (parentId) {
      if (Number(parentId) === Number(id)) {
        return fail(res, '父分类不能是自己');
      }
      const parent = await prisma.category.findUnique({ where: { id: Number(parentId) } });
      if (!parent) return fail(res, '父分类不存在');

      const descendants = await getDescendantIds(Number(id));
      if (descendants.includes(Number(parentId))) {
        return fail(res, '父分类不能是自己的子分类');
      }
    }

    if (code && code !== category.code) {
      const codeExists = await prisma.category.findUnique({ where: { code } });
      if (codeExists) return fail(res, '分类编码已存在');
    }

    if (name && name !== category.name) {
      const nameExists = await prisma.category.findUnique({ where: { name } });
      if (nameExists) return fail(res, '分类名称已存在');
    }

    const data = {};
    if (code !== undefined) data.code = code;
    if (name !== undefined) data.name = name;
    if (parentId !== undefined) data.parentId = parentId ? Number(parentId) : null;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await prisma.category.update({
      where: { id: Number(id) },
      data,
      include: {
        parent: { select: { id: true, name: true } },
      },
    });

    return success(res, updated, '更新成功');
  } catch (err) {
    console.error('updateCategory error:', err);
    return fail(res, '更新分类失败');
  }
}

async function getDescendantIds(categoryId) {
  const ids = [];
  const stack = [categoryId];
  while (stack.length > 0) {
    const currentId = stack.pop();
    const children = await prisma.category.findMany({
      where: { parentId: currentId },
      select: { id: true },
    });
    for (const child of children) {
      ids.push(child.id);
      stack.push(child.id);
    }
  }
  return ids;
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({ where: { id: Number(id) } });
    if (!category) return notFound(res, '分类不存在');

    const childCount = await prisma.category.count({ where: { parentId: Number(id) } });
    if (childCount > 0) return fail(res, '该分类存在子分类，无法删除');

    const productCount = await prisma.product.count({ where: { categoryId: Number(id) } });
    if (productCount > 0) return fail(res, '该分类下存在产品，无法删除');

    await prisma.category.delete({ where: { id: Number(id) } });
    return success(res, null, '删除成功');
  } catch (err) {
    console.error('deleteCategory error:', err);
    return fail(res, '删除分类失败');
  }
}
