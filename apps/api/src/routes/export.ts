import { Hono } from 'hono';
import { Parser } from 'json2csv';
import { eq, and, gte, lte, or, sql, desc, asc } from 'drizzle-orm';
import { db } from '../db';
import {
  members,
  users,
  trainingCamps,
  checkinRecords,
  refundRequests,
  refundRules,
  memberBenefits,
  todos,
} from '../db/schema';

const exportRouter = new Hono();

function buildDateRange(query: Record<string, string>, startKey: string, endKey: string, field: any) {
  const conditions: any[] = [];
  if (query[startKey]) {
    conditions.push(gte(field, new Date(query[startKey])));
  }
  if (query[endKey]) {
    conditions.push(lte(field, new Date(query[endKey])));
  }
  return conditions;
}

function csvResponse(data: any[], filename: string, fields: { label: string; value: string }[]) {
  try {
    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    console.error('CSV generation error:', e);
    throw e;
  }
}

exportRouter.get('/members', async (c) => {
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];

  if (query.campId) {
    conditions.push(eq(members.campId, query.campId));
  }
  if (query.status) {
    conditions.push(eq(members.status, query.status as any));
  }
  if (query.conversionSource) {
    conditions.push(eq(members.conversionSource, query.conversionSource as any));
  }
  if (query.salesPerson) {
    conditions.push(eq(members.salesPerson, query.salesPerson));
  }
  if (query.isFallingBehind === 'true') {
    conditions.push(eq(members.isFallingBehind, true));
  }
  conditions.push(...buildDateRange(query, 'joinDateStart', 'joinDateEnd', members.joinDate));
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const data = await db
    .select({
      会员编号: members.memberNo,
      学员姓名: users.name,
      邮箱: users.email,
      手机号: users.phone,
      营期名称: trainingCamps.name,
      会员状态: sql`CASE members.status
        WHEN 'active' THEN '正常'
        WHEN 'expired' THEN '已过期'
        WHEN 'refunded' THEN '已退款'
        WHEN 'paused' THEN '已暂停'
        ELSE members.status END`,
      入营时间: members.joinDate,
      过期时间: members.expiryDate,
      转化来源: sql`CASE members.conversion_source
        WHEN 'wechat_group' THEN '微信群'
        WHEN 'wechat_moments' THEN '朋友圈'
        WHEN 'douyin' THEN '抖音'
        WHEN 'xiaohongshu' THEN '小红书'
        WHEN 'zhihu' THEN '知乎'
        WHEN 'referral' THEN '转介绍'
        WHEN 'offline' THEN '线下'
        WHEN 'other' THEN '其他'
        ELSE members.conversion_source END`,
      来源详情: members.conversionSourceDetail,
      销售: members.salesPerson,
      学习进度: sql`members.progress || '%'`,
      总章节数: members.totalChapters,
      已完成章节数: members.completedChapters,
      是否掉队: sql`CASE WHEN members.is_falling_behind THEN '是' ELSE '否' END`,
      最后活跃时间: members.lastActiveAt,
      创建时间: members.createdAt,
    })
    .from(members)
    .leftJoin(users, eq(users.id, members.userId))
    .leftJoin(trainingCamps, eq(trainingCamps.id, members.campId))
    .where(where)
    .orderBy(desc(members.joinDate));

  const fields = [
    { label: '会员编号', value: '会员编号' },
    { label: '学员姓名', value: '学员姓名' },
    { label: '邮箱', value: '邮箱' },
    { label: '手机号', value: '手机号' },
    { label: '营期名称', value: '营期名称' },
    { label: '会员状态', value: '会员状态' },
    { label: '入营时间', value: '入营时间' },
    { label: '过期时间', value: '过期时间' },
    { label: '转化来源', value: '转化来源' },
    { label: '来源详情', value: '来源详情' },
    { label: '销售', value: '销售' },
    { label: '学习进度', value: '学习进度' },
    { label: '总章节数', value: '总章节数' },
    { label: '已完成章节数', value: '已完成章节数' },
    { label: '是否掉队', value: '是否掉队' },
    { label: '最后活跃时间', value: '最后活跃时间' },
    { label: '创建时间', value: '创建时间' },
  ];

  return csvResponse(data, '会员明细', fields);
});

exportRouter.get('/checkins', async (c) => {
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];

  if (query.campId) {
    conditions.push(eq(checkinRecords.campId, query.campId));
  }
  if (query.status) {
    conditions.push(eq(checkinRecords.status, query.status as any));
  }
  if (query.reviewedBy) {
    conditions.push(eq(checkinRecords.reviewedBy, query.reviewedBy));
  }
  conditions.push(...buildDateRange(query, 'startDate', 'endDate', checkinRecords.checkedInAt));
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const data = await db
    .select({
      打卡ID: checkinRecords.id,
      会员编号: members.memberNo,
      学员姓名: users.name,
      营期名称: trainingCamps.name,
      章节: sql`chapters.title`,
      打卡内容: checkinRecords.content,
      状态: sql`CASE checkin_records.status
        WHEN 'pending' THEN '待审核'
        WHEN 'approved' THEN '已通过'
        WHEN 'rejected' THEN '已拒绝'
        ELSE checkin_records.status END`,
      打卡时间: checkinRecords.checkedInAt,
      审核人: sql`(SELECT name FROM users WHERE id = checkin_records.reviewed_by)`,
      审核时间: checkinRecords.reviewedAt,
      审核备注: checkinRecords.reviewComment,
    })
    .from(checkinRecords)
    .leftJoin(members, eq(members.id, checkinRecords.memberId))
    .leftJoin(users, eq(users.id, members.userId))
    .leftJoin(trainingCamps, eq(trainingCamps.id, checkinRecords.campId))
    .leftJoin(sql`chapters`, eq(sql`chapters.id`, checkinRecords.chapterId))
    .where(where)
    .orderBy(desc(checkinRecords.checkedInAt));

  const fields = [
    { label: '打卡ID', value: '打卡ID' },
    { label: '会员编号', value: '会员编号' },
    { label: '学员姓名', value: '学员姓名' },
    { label: '营期名称', value: '营期名称' },
    { label: '章节', value: '章节' },
    { label: '打卡内容', value: '打卡内容' },
    { label: '状态', value: '状态' },
    { label: '打卡时间', value: '打卡时间' },
    { label: '审核人', value: '审核人' },
    { label: '审核时间', value: '审核时间' },
    { label: '审核备注', value: '审核备注' },
  ];

  return csvResponse(data, '打卡记录明细', fields);
});

exportRouter.get('/refunds', async (c) => {
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];

  if (query.status) {
    conditions.push(eq(refundRequests.status, query.status as any));
  }
  if (query.processedBy) {
    conditions.push(eq(refundRequests.processedBy, query.processedBy));
  }
  if (query.campId) {
    conditions.push(eq(members.campId, query.campId));
  }
  conditions.push(...buildDateRange(query, 'startDate', 'endDate', refundRequests.requestedAt));
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const data = await db
    .select({
      申请ID: refundRequests.id,
      会员编号: members.memberNo,
      学员姓名: users.name,
      营期名称: trainingCamps.name,
      适用规则: refundRules.name,
      退款原因: refundRequests.reason,
      退款金额: refundRequests.amount,
      状态: sql`CASE refund_requests.status
        WHEN 'pending' THEN '待处理'
        WHEN 'approved' THEN '已同意'
        WHEN 'rejected' THEN '已拒绝'
        WHEN 'processed' THEN '已完成'
        ELSE refund_requests.status END`,
      申请时间: refundRequests.requestedAt,
      处理人: sql`(SELECT name FROM users WHERE id = refund_requests.processed_by)`,
      处理时间: refundRequests.processedAt,
      处理备注: refundRequests.processComment,
    })
    .from(refundRequests)
    .leftJoin(members, eq(members.id, refundRequests.memberId))
    .leftJoin(users, eq(users.id, members.userId))
    .leftJoin(trainingCamps, eq(trainingCamps.id, members.campId))
    .leftJoin(refundRules, eq(refundRules.id, refundRequests.ruleId))
    .where(where)
    .orderBy(desc(refundRequests.requestedAt));

  const fields = [
    { label: '申请ID', value: '申请ID' },
    { label: '会员编号', value: '会员编号' },
    { label: '学员姓名', value: '学员姓名' },
    { label: '营期名称', value: '营期名称' },
    { label: '适用规则', value: '适用规则' },
    { label: '退款原因', value: '退款原因' },
    { label: '退款金额', value: '退款金额' },
    { label: '状态', value: '状态' },
    { label: '申请时间', value: '申请时间' },
    { label: '处理人', value: '处理人' },
    { label: '处理时间', value: '处理时间' },
    { label: '处理备注', value: '处理备注' },
  ];

  return csvResponse(data, '退款明细', fields);
});

exportRouter.get('/benefits', async (c) => {
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];

  if (query.type) {
    conditions.push(eq(memberBenefits.type, query.type as any));
  }
  if (query.isUsed === 'true') {
    conditions.push(eq(memberBenefits.isUsed, true));
  } else if (query.isUsed === 'false') {
    conditions.push(eq(memberBenefits.isUsed, false));
  }
  conditions.push(...buildDateRange(query, 'createdStart', 'createdEnd', memberBenefits.createdAt));
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const data = await db
    .select({
      权益ID: memberBenefits.id,
      会员编号: members.memberNo,
      学员姓名: users.name,
      权益类型: sql`CASE member_benefits.type
        WHEN 'discount' THEN '折扣券'
        WHEN 'gift' THEN '赠品'
        WHEN 'service' THEN '服务'
        WHEN 'other' THEN '其他'
        ELSE member_benefits.type END`,
      权益名称: memberBenefits.name,
      描述: memberBenefits.description,
      价值: memberBenefits.value,
      是否已用: sql`CASE WHEN member_benefits.is_used THEN '是' ELSE '否' END`,
      使用时间: memberBenefits.usedAt,
      过期时间: memberBenefits.expiresAt,
      发放时间: memberBenefits.createdAt,
    })
    .from(memberBenefits)
    .leftJoin(members, eq(members.id, memberBenefits.memberId))
    .leftJoin(users, eq(users.id, members.userId))
    .where(where)
    .orderBy(desc(memberBenefits.createdAt));

  const fields = [
    { label: '权益ID', value: '权益ID' },
    { label: '会员编号', value: '会员编号' },
    { label: '学员姓名', value: '学员姓名' },
    { label: '权益类型', value: '权益类型' },
    { label: '权益名称', value: '权益名称' },
    { label: '描述', value: '描述' },
    { label: '价值', value: '价值' },
    { label: '是否已用', value: '是否已用' },
    { label: '使用时间', value: '使用时间' },
    { label: '过期时间', value: '过期时间' },
    { label: '发放时间', value: '发放时间' },
  ];

  return csvResponse(data, '会员权益明细', fields);
});

exportRouter.get('/todos', async (c) => {
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];

  if (query.status) {
    conditions.push(eq(todos.status, query.status as any));
  }
  if (query.type) {
    conditions.push(eq(todos.type, query.type as any));
  }
  if (query.priority) {
    conditions.push(eq(todos.priority, query.priority as any));
  }
  if (query.assigneeId) {
    conditions.push(eq(todos.assigneeId, query.assigneeId));
  }
  if (query.campId) {
    conditions.push(eq(todos.campId, query.campId));
  }
  conditions.push(...buildDateRange(query, 'createdStart', 'createdEnd', todos.createdAt));
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const data = await db
    .select({
      待办ID: todos.id,
      标题: todos.title,
      描述: todos.description,
      类型: sql`CASE todos.type
        WHEN 'fall_behind_warning' THEN '掉队预警'
        WHEN 'checkin_review' THEN '打卡审核'
        WHEN 'refund_review' THEN '退款审核'
        WHEN 'custom' THEN '自定义'
        ELSE todos.type END`,
      优先级: sql`CASE todos.priority
        WHEN 'low' THEN '低'
        WHEN 'medium' THEN '中'
        WHEN 'high' THEN '高'
        WHEN 'urgent' THEN '紧急'
        ELSE todos.priority END`,
      状态: sql`CASE todos.status
        WHEN 'pending' THEN '待处理'
        WHEN 'in_progress' THEN '处理中'
        WHEN 'completed' THEN '已完成'
        WHEN 'cancelled' THEN '已取消'
        ELSE todos.status END`,
      处理人: sql`(SELECT name FROM users WHERE id = todos.assignee_id)`,
      关联营期: trainingCamps.name,
      关联会员: members.memberNo,
      关联学员: sql`(SELECT u.name FROM users u JOIN members m ON u.id = m.user_id WHERE m.id = todos.member_id)`,
      截止时间: todos.dueDate,
      完成时间: todos.completedAt,
      创建人: sql`(SELECT name FROM users WHERE id = todos.created_by)`,
      创建时间: todos.createdAt,
    })
    .from(todos)
    .leftJoin(trainingCamps, eq(trainingCamps.id, todos.campId))
    .leftJoin(members, eq(members.id, todos.memberId))
    .where(where)
    .orderBy(desc(todos.createdAt));

  const fields = [
    { label: '待办ID', value: '待办ID' },
    { label: '标题', value: '标题' },
    { label: '描述', value: '描述' },
    { label: '类型', value: '类型' },
    { label: '优先级', value: '优先级' },
    { label: '状态', value: '状态' },
    { label: '处理人', value: '处理人' },
    { label: '关联营期', value: '关联营期' },
    { label: '关联会员', value: '关联会员' },
    { label: '关联学员', value: '关联学员' },
    { label: '截止时间', value: '截止时间' },
    { label: '完成时间', value: '完成时间' },
    { label: '创建人', value: '创建人' },
    { label: '创建时间', value: '创建时间' },
  ];

  return csvResponse(data, '待办明细', fields);
});

exportRouter.get('/conversion-by-source', async (c) => {
  const query = c.req.query();

  let where: any = undefined;
  const conditions: any[] = [];

  if (query.campId) {
    conditions.push(eq(members.campId, query.campId));
  }
  conditions.push(...buildDateRange(query, 'startDate', 'endDate', members.joinDate));
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const data = await db
    .select({
      转化来源: sql`CASE members.conversion_source
        WHEN 'wechat_group' THEN '微信群'
        WHEN 'wechat_moments' THEN '朋友圈'
        WHEN 'douyin' THEN '抖音'
        WHEN 'xiaohongshu' THEN '小红书'
        WHEN 'zhihu' THEN '知乎'
        WHEN 'referral' THEN '转介绍'
        WHEN 'offline' THEN '线下'
        WHEN 'other' THEN '其他'
        ELSE members.conversion_source END`,
      来源编码: members.conversionSource,
      营期名称: trainingCamps.name,
      会员编号: members.memberNo,
      学员姓名: users.name,
      手机号: users.phone,
      销售: members.salesPerson,
      来源详情: members.conversionSourceDetail,
      入营时间: members.joinDate,
      订单金额: trainingCamps.price,
      会员状态: sql`CASE members.status
        WHEN 'active' THEN '正常'
        WHEN 'expired' THEN '已过期'
        WHEN 'refunded' THEN '已退款'
        WHEN 'paused' THEN '已暂停'
        ELSE members.status END`,
    })
    .from(members)
    .leftJoin(users, eq(users.id, members.userId))
    .leftJoin(trainingCamps, eq(trainingCamps.id, members.campId))
    .where(where)
    .orderBy(asc(members.conversionSource), desc(members.joinDate));

  const fields = [
    { label: '转化来源', value: '转化来源' },
    { label: '来源编码', value: '来源编码' },
    { label: '营期名称', value: '营期名称' },
    { label: '会员编号', value: '会员编号' },
    { label: '学员姓名', value: '学员姓名' },
    { label: '手机号', value: '手机号' },
    { label: '销售', value: '销售' },
    { label: '来源详情', value: '来源详情' },
    { label: '入营时间', value: '入营时间' },
    { label: '订单金额', value: '订单金额' },
    { label: '会员状态', value: '会员状态' },
  ];

  return csvResponse(data, '转化来源明细', fields);
});

export { exportRouter };
