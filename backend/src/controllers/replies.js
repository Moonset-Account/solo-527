import prisma from '../utils/prisma.js';
import { success, fail, paginate, notFound } from '../utils/response.js';

const REPLY_INCLUDE = {
  fromUser: { select: { id: true, username: true, realName: true, role: true } },
  toUser: { select: { id: true, username: true, realName: true, role: true } },
  parent: {
    include: {
      fromUser: { select: { id: true, username: true, realName: true, role: true } },
    },
  },
  children: {
    include: {
      fromUser: { select: { id: true, username: true, realName: true, role: true } },
      toUser: { select: { id: true, username: true, realName: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
  purchaseOrder: { select: { id: true, orderNo: true, status: true } },
  inboundOrder: { select: { id: true, orderNo: true, status: true } },
  exception: { select: { id: true, exceptionNo: true, title: true, status: true } },
};

export async function getReplies(req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      type,
      purchaseOrderId,
      inboundOrderId,
      exceptionId,
      status,
      isPublic,
    } = req.query;

    const where = {};

    if (type) where.type = type;
    if (purchaseOrderId) where.purchaseOrderId = Number(purchaseOrderId);
    if (inboundOrderId) where.inboundOrderId = Number(inboundOrderId);
    if (exceptionId) where.exceptionId = Number(exceptionId);
    if (status) where.status = status;
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    where.replyToId = null;

    if (req.user.supplierId) {
      where.OR = [
        { fromUserId: req.user.id },
        { toUserId: req.user.id },
      ];
      where.isPublic = true;
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const [list, total] = await Promise.all([
      prisma.supplierReply.findMany({
        where,
        include: REPLY_INCLUDE,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplierReply.count({ where }),
    ]);

    return success(res, paginate(list, page, pageSize, total));
  } catch (err) {
    console.error('getReplies error:', err);
    return fail(res, '获取回复列表失败');
  }
}

export async function getRepliesByPurchaseOrder(req, res) {
  try {
    const { purchaseOrderId } = req.params;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: Number(purchaseOrderId) },
      select: { id: true, supplierId: true },
    });
    if (!po) return notFound(res, '采购单不存在');

    if (req.user.supplierId && po.supplierId !== req.user.supplierId) {
      return fail(res, '无权限查看此采购单的回复', 403);
    }

    const replies = await prisma.supplierReply.findMany({
      where: {
        purchaseOrderId: Number(purchaseOrderId),
        replyToId: null,
      },
      include: REPLY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return success(res, { list: replies, total: replies.length });
  } catch (err) {
    console.error('getRepliesByPurchaseOrder error:', err);
    return fail(res, '获取采购单回复失败');
  }
}

export async function getRepliesByInboundOrder(req, res) {
  try {
    const { inboundOrderId } = req.params;

    const order = await prisma.inboundOrder.findUnique({
      where: { id: Number(inboundOrderId) },
      select: { id: true, supplierId: true },
    });
    if (!order) return notFound(res, '入库单不存在');

    if (req.user.supplierId && order.supplierId !== req.user.supplierId) {
      return fail(res, '无权限查看此入库单的回复', 403);
    }

    const replies = await prisma.supplierReply.findMany({
      where: {
        inboundOrderId: Number(inboundOrderId),
        replyToId: null,
      },
      include: REPLY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return success(res, { list: replies, total: replies.length });
  } catch (err) {
    console.error('getRepliesByInboundOrder error:', err);
    return fail(res, '获取入库单回复失败');
  }
}

export async function getRepliesByException(req, res) {
  try {
    const { exceptionId } = req.params;

    const exc = await prisma.exceptionRecord.findUnique({
      where: { id: Number(exceptionId) },
      select: { id: true, supplierId: true },
    });
    if (!exc) return notFound(res, '异常记录不存在');

    if (req.user.supplierId && exc.supplierId !== req.user.supplierId) {
      return fail(res, '无权限查看此异常的回复', 403);
    }

    const replies = await prisma.supplierReply.findMany({
      where: {
        exceptionId: Number(exceptionId),
        replyToId: null,
      },
      include: REPLY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return success(res, { list: replies, total: replies.length });
  } catch (err) {
    console.error('getRepliesByException error:', err);
    return fail(res, '获取异常回复失败');
  }
}

export async function createReply(req, res) {
  try {
    const {
      type,
      purchaseOrderId,
      inboundOrderId,
      exceptionId,
      toUserId,
      subject,
      content,
      replyToId,
      isPublic = true,
      attachmentUrl,
    } = req.body;

    if (!type) return fail(res, '请选择回复类型');
    if (!subject) return fail(res, '请填写标题');
    if (!content) return fail(res, '请填写内容');

    if (!purchaseOrderId && !inboundOrderId && !exceptionId) {
      return fail(res, '请关联采购单、入库单或异常记录');
    }

    if (purchaseOrderId) {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: Number(purchaseOrderId) },
        select: { id: true, supplierId: true },
      });
      if (!po) return fail(res, '关联采购单不存在');
      if (req.user.supplierId && po.supplierId !== req.user.supplierId) {
        return fail(res, '无权限对此采购单发表回复', 403);
      }
    }

    if (inboundOrderId) {
      const order = await prisma.inboundOrder.findUnique({
        where: { id: Number(inboundOrderId) },
        select: { id: true, supplierId: true },
      });
      if (!order) return fail(res, '关联入库单不存在');
      if (req.user.supplierId && order.supplierId !== req.user.supplierId) {
        return fail(res, '无权限对此入库单发表回复', 403);
      }
    }

    if (exceptionId) {
      const exc = await prisma.exceptionRecord.findUnique({
        where: { id: Number(exceptionId) },
        select: { id: true, supplierId: true },
      });
      if (!exc) return fail(res, '关联异常记录不存在');
      if (req.user.supplierId && exc.supplierId !== req.user.supplierId) {
        return fail(res, '无权限对此异常发表回复', 403);
      }
    }

    if (replyToId) {
      const parent = await prisma.supplierReply.findUnique({
        where: { id: Number(replyToId) },
      });
      if (!parent) return fail(res, '被回复的消息不存在');
    }

    const reply = await prisma.supplierReply.create({
      data: {
        type,
        supplierId: req.user.supplierId || null,
        purchaseOrderId: purchaseOrderId ? Number(purchaseOrderId) : null,
        inboundOrderId: inboundOrderId ? Number(inboundOrderId) : null,
        exceptionId: exceptionId ? Number(exceptionId) : null,
        fromUserId: req.user.id,
        toUserId: toUserId ? Number(toUserId) : null,
        subject,
        content,
        replyToId: replyToId ? Number(replyToId) : null,
        status: 'UNREAD',
        isPublic: Boolean(isPublic),
        attachmentUrl,
      },
      include: REPLY_INCLUDE,
    });

    if (toUserId) {
      try {
        await prisma.alert.create({
          data: {
            type: 'SUPPLIER_REPLY',
            title: `新回复: ${subject}`,
            content: content.substring(0, 100),
            status: 'UNREAD',
            targetUserId: Number(toUserId),
            relatedType: type,
            relatedId: purchaseOrderId || inboundOrderId || exceptionId,
          },
        });
      } catch (alertErr) {
        console.error('创建通知失败:', alertErr);
      }
    }

    return success(res, reply, '回复成功', 201);
  } catch (err) {
    console.error('createReply error:', err);
    return fail(res, '回复失败: ' + err.message);
  }
}

export async function markReplyRead(req, res) {
  try {
    const { id } = req.params;

    const reply = await prisma.supplierReply.findUnique({
      where: { id: Number(id) },
    });
    if (!reply) return notFound(res, '回复不存在');

    const updated = await prisma.supplierReply.update({
      where: { id: Number(id) },
      data: { status: 'READ' },
      include: REPLY_INCLUDE,
    });

    return success(res, updated, '已标记为已读');
  } catch (err) {
    console.error('markReplyRead error:', err);
    return fail(res, '标记已读失败');
  }
}
