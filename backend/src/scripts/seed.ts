import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/data-source';
import * as bcrypt from 'bcryptjs';

import { User, UserDepartment, UserStatus } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { UserRole } from '../entities/user-role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Contract, ContractStatus, ContractType, UrgencyLevel } from '../entities/contract.entity';
import { ContractAttachment, AttachmentType, AttachmentStatus } from '../entities/contract-attachment.entity';
import { ApprovalFlow, ApprovalStatus, ApprovalNodeType } from '../entities/approval-flow.entity';
import { ConflictRecord, ConflictStatus, ConflictSeverity, ConflictType } from '../entities/conflict-record.entity';
import { Notification, NotificationType, NotificationChannel, NotificationStatus } from '../entities/notification.entity';
import { CallbackLog, CallbackType, CallbackStatus } from '../entities/callback-log.entity';
import { ContractNumberPool, NumberPoolStatus } from '../entities/contract-number-pool.entity';

async function run() {
  console.log('🌱 开始种子数据初始化...');

  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  const permRepo = dataSource.getRepository(Permission);
  const userRoleRepo = dataSource.getRepository(UserRole);
  const rolePermRepo = dataSource.getRepository(RolePermission);
  const contractRepo = dataSource.getRepository(Contract);
  const attachmentRepo = dataSource.getRepository(ContractAttachment);
  const approvalRepo = dataSource.getRepository(ApprovalFlow);
  const conflictRepo = dataSource.getRepository(ConflictRecord);
  const notificationRepo = dataSource.getRepository(Notification);
  const callbackRepo = dataSource.getRepository(CallbackLog);
  const numberPoolRepo = dataSource.getRepository(ContractNumberPool);

  const existingCount = await userRepo.count();
  let adminUser: User | null = null;
  let testUsers: User[] = [];
  let testContracts: Contract[] = [];

  if (existingCount === 0) {
    console.log('  → 创建用户和角色...');

    const permCodes = [
      'contract:create', 'contract:view', 'contract:update', 'contract:delete', 'contract:archive', 'contract:number:manage',
      'approval:submit', 'approval:review', 'approval:view',
      'file:upload', 'file:download', 'file:permission:manage',
      'user:manage',
    ];
    const perms: Permission[] = [];
    for (const code of permCodes) {
      const [resource, action] = code.split(':');
      const p = permRepo.create({ code, name: code, resource, action, enabled: true });
      perms.push(await permRepo.save(p));
    }

    const roleData = [
      { code: 'super_admin', name: '超级管理员' },
      { code: 'legal_admin', name: '法务主管' },
      { code: 'legal_reviewer', name: '法务审核' },
      { code: 'finance_reviewer', name: '财务审核' },
      { code: 'contract_applicant', name: '合同申请人' },
    ];
    const roles: Role[] = [];
    for (const rd of roleData) {
      const role = roleRepo.create({ ...rd, description: `系统预置角色: ${rd.name}`, enabled: true });
      roles.push(await roleRepo.save(role));
      const rps = perms.map(p => rolePermRepo.create({ roleId: role.id, permissionId: p.id }));
      await rolePermRepo.save(rps);
    }

    const adminPwd = await bcrypt.hash('admin123', 10);
    adminUser = userRepo.create({
      username: 'admin', password: adminPwd, realName: '系统管理员',
      email: 'admin@legal.com', phone: '13800000000', department: 'admin',
      status: UserStatus.ACTIVE,
    });
    adminUser = await userRepo.save(adminUser);
    await userRoleRepo.save(userRoleRepo.create({ userId: adminUser.id, roleId: roles[0].id }));

    const userPwd = await bcrypt.hash('123456', 10);
    const userProfiles = [
      { username: 'zhangwei', realName: '张伟', email: 'zhangwei@legal.com', phone: '13800000001', department: UserDepartment.LEGAL, roleIdx: 1 },
      { username: 'liming', realName: '李明', email: 'liming@finance.com', phone: '13800000002', department: UserDepartment.FINANCE, roleIdx: 3 },
      { username: 'wangfang', realName: '王芳', email: 'wangfang@biz.com', phone: '13800000003', department: UserDepartment.BUSINESS, roleIdx: 4 },
      { username: 'chenjie', realName: '陈杰', email: 'chenjie@hr.com', phone: '13800000004', department: UserDepartment.HR, roleIdx: 4 },
      { username: 'liuhong', realName: '刘红', email: 'liuhong@legal.com', phone: '13800000005', department: UserDepartment.LEGAL, roleIdx: 2 },
    ];
    for (const up of userProfiles) {
      const u = userRepo.create({
        ...up, password: userPwd, status: UserStatus.ACTIVE,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${up.realName}`,
      });
      const saved = await userRepo.save(u);
      testUsers.push(saved);
      await userRoleRepo.save(userRoleRepo.create({ userId: saved.id, roleId: roles[up.roleIdx].id }));
    }
  } else {
    adminUser = await userRepo.findOne({ where: { username: 'admin' } });
    testUsers = await userRepo.find({ where: { username: Not('admin') } as any, take: 10 });
  }

  const contractCount = await contractRepo.count();
  if (contractCount === 0 && testUsers.length > 0) {
    console.log('  → 创建测试合同...');
    const now = new Date();
    const contractsData = [
      { title: '2024年度供应商框架采购合同', contractType: ContractType.PURCHASE, partyA: '北京科技有限公司', partyB: '上海供应链管理有限公司', amount: 5800000, urgency: UrgencyLevel.VERY_URGENT, status: ContractStatus.APPROVING, materialsComplete: true, summary: '2024年度生产原材料集中采购框架协议' },
      { title: '软件开发服务外包合同', contractType: ContractType.SERVICE, partyA: '北京科技有限公司', partyB: '深圳软件技术有限公司', amount: 1280000, urgency: UrgencyLevel.NORMAL, status: ContractStatus.DRAFT, materialsComplete: false, summary: 'ERP系统二期开发外包服务' },
      { title: '办公场地租赁合同', contractType: ContractType.LEASE, partyA: '北京科技有限公司', partyB: '北京地产运营有限公司', amount: 3200000, urgency: UrgencyLevel.URGENT, status: ContractStatus.APPROVING, materialsComplete: true, summary: '望京SOHO T3-15层办公场地租赁' },
      { title: '设备维保服务合同', contractType: ContractType.SERVICE, partyA: '北京科技有限公司', partyB: '北京设备服务有限公司', amount: 680000, urgency: UrgencyLevel.NORMAL, status: ContractStatus.SIGNED, materialsComplete: true, summary: '生产设备年度维保服务', rejectionReason: null },
      { title: '人力资源外包协议', contractType: ContractType.SERVICE, partyA: '北京科技有限公司', partyB: '上海人力资源服务有限公司', amount: 2580000, urgency: UrgencyLevel.NORMAL, status: ContractStatus.ARCHIVED, materialsComplete: true, summary: '2024年人力资源外包服务协议' },
      { title: '品牌营销合作合同', contractType: ContractType.COOPERATION, partyA: '北京科技有限公司', partyB: '上海品牌管理有限公司', amount: 4200000, urgency: UrgencyLevel.URGENT, status: ContractStatus.REJECTED, materialsComplete: false, summary: '品牌联合推广营销合作', rejectionReason: '预算超标，需重新评估ROI' },
      { title: '原材料采购合同', contractType: ContractType.PURCHASE, partyA: '北京科技有限公司', partyB: '宁波材料科技有限公司', amount: 1680000, urgency: UrgencyLevel.NORMAL, status: ContractStatus.SIGNED, materialsComplete: true, summary: '特殊原材料年度采购合同' },
      { title: '咨询服务合同', contractType: ContractType.SERVICE, partyA: '北京科技有限公司', partyB: '国际咨询管理有限公司', amount: 6800000, urgency: UrgencyLevel.NORMAL, status: ContractStatus.DRAFT, materialsComplete: false, summary: '数字化转型战略咨询服务', rejectionReason: null },
      { title: 'NDA保密协议', contractType: ContractType.CONFIDENTIAL, partyA: '北京科技有限公司', partyB: '投资合伙人有限公司', amount: 0, urgency: UrgencyLevel.NORMAL, status: ContractStatus.SIGNED, materialsComplete: true, summary: '投融资尽职调查保密协议', rejectionReason: null },
      { title: '原材料采购合同', contractType: ContractType.PURCHASE, partyA: '北京科技有限公司', partyB: '鞍山钢铁股份有限公司', amount: 12500000, urgency: UrgencyLevel.URGENT, status: ContractStatus.PENDING, materialsComplete: true, summary: 'Q3生产用特种钢材5000吨采购合同' },
    ];

    for (let i = 0; i < contractsData.length; i++) {
      const data = contractsData[i] as any;
      const applicant = testUsers[i % testUsers.length];
      const owner = testUsers[(i + 2) % testUsers.length];
      const year = now.getFullYear();
      const seqNo = i + 1;
      const contractNo = `HT-${year}-${String(seqNo).padStart(5, '0')}`;
      const c = contractRepo.create({
        ...data, contractNo, applicantId: applicant.id, ownerId: owner.id, currency: 'CNY',
        effectiveDate: new Date(now.getFullYear(), now.getMonth(), 1),
        expiryDate: new Date(now.getFullYear() + 1, now.getMonth(), 1),
        materialChecklist: [
          { name: '合同正文', required: true, uploaded: true, remark: '已上传' },
          { name: '对方营业执照', required: true, uploaded: data.materialsComplete, remark: data.materialsComplete ? '已核验' : '待补充' },
          { name: '授权委托书', required: true, uploaded: data.materialsComplete, remark: data.materialsComplete ? '已上传' : '待上传' },
          { name: '报价单/比价表', required: data.amount > 1000000, uploaded: data.amount > 1000000 && data.materialsComplete },
          { name: '立项审批单', required: true, uploaded: true, remark: '审批通过' },
        ],
        customFields: {
          contractCategory: ['生产', '行政', '技术', '人力', '市场'][i % 5],
          projectCode: `PRJ-${2024}-${String(i + 1).padStart(3, '0')}`,
        },
      });
      testContracts.push(await contractRepo.save(c));
    }
  } else {
    testContracts = await contractRepo.find({ take: 10 });
  }

  const approvalCount = await approvalRepo.count();
  if (approvalCount === 0 && testContracts.length > 0 && testUsers.length >= 2 && adminUser) {
    console.log('  → 创建审批流程数据...');
    const approvers = [testUsers[4] || testUsers[0], testUsers[1] || testUsers[0], adminUser].filter(Boolean);
    for (const contract of testContracts) {
      if (contract.status === ContractStatus.APPROVING || contract.status === ContractStatus.PENDING) {
        for (let i = 0; i < approvers.length; i++) {
          const approver = approvers[i];
          const status = i === 0 ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING;
          const a = approvalRepo.create({
            contractId: contract.id, approverId: approver.id,
            nodeName: ['法务审核', '财务审核', '最终审批'][i], nodeType: ApprovalNodeType.SINGLE,
            stepOrder: i + 1, status,
            approvedAt: status === ApprovalStatus.APPROVED ? new Date() : null,
            opinion: status === ApprovalStatus.APPROVED ? '已审核，材料完整' : null,
            signature: status === ApprovalStatus.APPROVED ? { sign: `SIGN_${contract.id}_${approver.id}` } : null,
            durationHours: status === ApprovalStatus.APPROVED ? Math.floor(Math.random() * 24 + 2) : 0,
          });
          await approvalRepo.save(a);
        }
      } else if (contract.status === ContractStatus.REJECTED) {
        const a1 = approvalRepo.create({
          contractId: contract.id, approverId: approvers[0].id,
          nodeName: '法务审核', nodeType: ApprovalNodeType.SINGLE, stepOrder: 1,
          status: ApprovalStatus.APPROVED,
          approvedAt: new Date(Date.now() - 86400000),
          opinion: '合同内容合法', durationHours: 4,
          signature: { sign: `SIGN_${contract.id}_${approvers[0].id}` },
        });
        await approvalRepo.save(a1);
        const a2 = approvalRepo.create({
          contractId: contract.id, approverId: approvers[1].id,
          nodeName: '财务审核', nodeType: ApprovalNodeType.SINGLE, stepOrder: 2,
          status: ApprovalStatus.REJECTED, rejectionReason: contract.rejectionReason,
          durationHours: 5,
        });
        await approvalRepo.save(a2);
      } else if (contract.status === ContractStatus.SIGNED || contract.status === ContractStatus.ARCHIVED) {
        for (let i = 0; i < approvers.length; i++) {
          const approver = approvers[i];
          const a = approvalRepo.create({
            contractId: contract.id, approverId: approver.id,
            nodeName: ['法务审核', '财务审核', '最终审批'][i],
            nodeType: ApprovalNodeType.SINGLE, stepOrder: i + 1,
            status: ApprovalStatus.APPROVED,
            approvedAt: new Date(Date.now() - (approvers.length - i) * 86400000),
            opinion: ['合同内容审核通过', '预算内，同意', '终审通过'][i],
            durationHours: Math.floor(Math.random() * 12 + 1),
            signature: { sign: `SIGN_${contract.id}_${approver.id}` },
          });
          await approvalRepo.save(a);
        }
      }
    }
  }

  const attachmentCount = await attachmentRepo.count();
  if (attachmentCount === 0 && testContracts.length > 0) {
    console.log('  → 创建合同附件数据...');
    const attachmentNames = ['合同正文.pdf', '营业执照副本.jpg', '授权委托书.pdf', '报价单.xlsx', '审批单.pdf'];
    const types = [AttachmentType.CONTRACT_MAIN, AttachmentType.BUSINESS_LICENSE, AttachmentType.PROOF, AttachmentType.OTHER, AttachmentType.OTHER];
    const mimeTypes = ['application/pdf', 'image/jpeg', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'];
    for (const contract of testContracts) {
      const count = contract.materialsComplete ? 5 : 2;
      for (let i = 0; i < count; i++) {
        const a = attachmentRepo.create({
          contractId: contract.id, originalName: attachmentNames[i], attachmentType: types[i],
          status: i < 3 ? AttachmentStatus.VERIFIED : AttachmentStatus.UPLOADED,
          mimeType: mimeTypes[i],
          fileSize: (i + 1) * 128000 + Math.floor(Math.random() * 500000),
          filePath: `/uploads/${contract.id}/${attachmentNames[i]}`,
          uploaderId: contract.applicantId,
          permissionConfig: {
            public: i < 3, viewRoles: ['legal_admin', 'legal_reviewer'],
            downloadRoles: ['legal_admin'], viewUsers: [], downloadUsers: [],
          },
          viewCount: Math.floor(Math.random() * 50),
          downloadCount: Math.floor(Math.random() * 20),
        });
        await attachmentRepo.save(a);
      }
    }
  }

  const conflictCount = await conflictRepo.count();
  if (conflictCount === 0 && testContracts.length > 2 && adminUser) {
    console.log('  → 创建冲突记录数据...');
    const conflicts = [
      {
        contractId: testContracts[2].id,
        title: '租赁合同资源冲突',
        description: '该办公楼层同时与两家公司进行租赁洽谈，存在资源抢占风险',
        conflictType: ConflictType.DATE_OVERLAP, severity: ConflictSeverity.HIGH,
        status: ConflictStatus.ASSIGNED,
        impactScope: '影响范围：\n1. 望京SOHO T3-15层 2800平米办公空间\n2. 预计影响200人团队搬迁计划\n3. 涉及预算860万元/年',
        handlerId: adminUser.id, reporterId: testUsers[0].id,
        nextSteps: '下一步计划：\n1. 24小时内与对方公司沟通协商\n2. 启动备选方案：联系绿地中心同面积楼层\n3. 评估违约成本',
        timeline: [{ time: new Date(), actor: adminUser.realName, action: '指派处理人', remark: '紧急事件，立即处理' }],
      },
      {
        contractId: testContracts[0].id,
        title: '知识产权冲突',
        description: '合同中涉及的算法模型与合作方已有专利存在知识产权归属争议',
        conflictType: ConflictType.OTHER, severity: ConflictSeverity.CRITICAL,
        status: ConflictStatus.RESOLVED,
        impactScope: '影响范围：\n1. 核心算法模型知识产权归属\n2. 后续商用收益分配比例\n3. 技术团队论文署名权',
        handlerId: testUsers[0].id, reporterId: testUsers[4].id,
        resolution: '已通过补充协议明确归属问题',
        nextSteps: '已完成：\n1. 补充条款明确：算法模型知识产权双方共有\n2. 商用收益按7:3分配',
        resolvedAt: new Date(),
        timeline: [{ time: new Date(Date.now() - 86400000), actor: testUsers[4].realName, action: '发现问题', remark: '法务审核发现IP风险' }],
      },
      {
        contractId: null,
        title: '编号池资源不足',
        description: '2026年度合同编号池剩余可用资源不足30%，存在编号断供风险',
        conflictType: ConflictType.NUMBER_CONFLICT, severity: ConflictSeverity.MEDIUM,
        status: ConflictStatus.OPEN,
        impactScope: '影响范围：\n1. 2026年Q3-Q4所有合同编号申请\n2. 预计涉及约500份合同\n3. 可能影响合同签署时效',
        reporterId: testUsers[0].id,
        nextSteps: '下一步计划：\n1. 扩大编号池容量至10000\n2. 清理过期预留编号释放资源',
      },
    ];
    for (const c of conflicts) {
      await conflictRepo.save(conflictRepo.create(c as any));
    }
  }

  const notificationCount = await notificationRepo.count();
  if (notificationCount === 0 && testContracts.length > 0 && testUsers.length > 0) {
    console.log('  → 创建通知数据...');
    const now = new Date();
    const notifications = [
      { recipientId: testUsers[1].id, type: NotificationType.APPROVAL_REQUEST, channel: NotificationChannel.IN_APP, title: '【待审批】采购合同等待您的审核', content: `合同《${testContracts[0].title}》已提交审批，请尽快处理`, relatedData: { contractId: testContracts[0].id }, status: NotificationStatus.SENT, sentAt: now },
      { recipientId: testUsers[2].id, type: NotificationType.MATERIAL_INCOMPLETE, channel: NotificationChannel.IN_APP, title: '【材料提醒】合同附件不完整', content: `您提交的《${testContracts[1].title}》缺少营业执照和授权委托书`, relatedData: { contractId: testContracts[1].id }, status: NotificationStatus.SENT, sentAt: now },
      { recipientId: testUsers[2].id, type: NotificationType.CONTRACT_REJECTED, channel: NotificationChannel.EMAIL, title: '【退回通知】合同被财务审核驳回', content: `您的《${testContracts[5].title}》被驳回：预算超标，需重新评估ROI`, relatedData: { contractId: testContracts[5].id }, status: NotificationStatus.SENT, sentAt: now },
      { recipientId: testUsers[0].id, type: NotificationType.CONFLICT_CREATED, channel: NotificationChannel.DINGTALK, title: '【冲突告警】检测到资源冲突需要处理', content: `租赁合同冲突事件已创建，请及时处理`, relatedData: { conflictId: 'temp' }, status: NotificationStatus.SENT, sentAt: now },
      { recipientId: adminUser?.id || testUsers[0].id, type: NotificationType.CALLBACK_FAILURE, channel: NotificationChannel.IN_APP, title: '【回调异常】支付回调连续失败2次', content: `支付网关回调失败，已进入重试队列，请关注`, status: NotificationStatus.RETRYING, retryCount: 2, maxRetryCount: 5, failureReason: '对方服务返回503 Service Unavailable', nextRetryAt: new Date(now.getTime() + 120000) },
    ];
    for (const n of notifications) {
      await notificationRepo.save(notificationRepo.create(n as any));
    }
  }

  const callbackCount = await callbackRepo.count();
  if (callbackCount === 0 && testContracts.length > 0) {
    console.log('  → 创建回调日志数据...');
    const contract = testContracts[0];
    const now = new Date();
    const callbacks = [
      { requestId: 'CB-INIT-001', callbackType: CallbackType.WEBHOOK, targetUrl: 'https://webhook.example.com/approval', requestPayload: JSON.stringify({ contractId: contract.id, status: 'approved' }), status: CallbackStatus.SUCCESS, responseStatusCode: 200, responseBody: JSON.stringify({ code: 0, message: 'ok' }), durationMs: 235, relatedId: contract.id, relatedType: 'contract', firstAttemptAt: now, lastAttemptAt: now, completedAt: now },
      { requestId: 'CB-INIT-002', callbackType: CallbackType.PAYMENT, targetUrl: 'https://payment-gateway.example.com/notify', requestPayload: JSON.stringify({ orderId: 'PAY20240601001', amount: 5800000 }), status: CallbackStatus.RETRYING, failureReason: '对方服务返回503 Service Unavailable', nextRetryAt: new Date(now.getTime() + 120000), retryCount: 2, relatedId: contract.id, relatedType: 'contract', firstAttemptAt: new Date(now.getTime() - 120000), lastAttemptAt: new Date(now.getTime() - 60000), retryHistory: [{ attempt: 1, time: new Date(now.getTime() - 120000), status: 'failed', statusCode: 503, error: '503 Service Unavailable', durationMs: 5000 }, { attempt: 2, time: new Date(now.getTime() - 60000), status: 'failed', statusCode: 503, error: '503 Service Unavailable', durationMs: 5000 }] },
      { requestId: 'CB-INIT-003', callbackType: CallbackType.ESIGN, targetUrl: 'https://esign.example.com/callback', requestPayload: JSON.stringify({ contractId: contract.id }), status: CallbackStatus.PENDING, relatedId: contract.id, relatedType: 'contract', firstAttemptAt: now },
      { requestId: 'CB-INIT-004', callbackType: CallbackType.SMS, targetUrl: 'https://sms.example.com/send', requestPayload: JSON.stringify({ phone: '13800000001', content: '您的合同已审批通过' }), status: CallbackStatus.FAILED, failureReason: '短信服务商账户余额不足，请充值后重试', retryCount: 5, maxRetryCount: 5, relatedId: contract.id, relatedType: 'contract', firstAttemptAt: new Date(now.getTime() - 300000), lastAttemptAt: new Date(now.getTime() - 60000), retryHistory: [{ attempt: i, time: new Date(now.getTime() - (5 - i) * 60000), status: 'failed', statusCode: 402, error: 'Insufficient balance', durationMs: 300 } for i in [1, 2, 3, 4, 5]] as any },
    ];
    for (const cb of callbacks) {
      await callbackRepo.save(callbackRepo.create(cb as any));
    }
  }

  const poolCount = await numberPoolRepo.count();
  if (poolCount === 0) {
    console.log('  → 创建编号池数据...');
    const year = new Date().getFullYear();
    const prefix = `HT-${year}`;
    for (let i = 1; i <= 20; i++) {
      const np = numberPoolRepo.create({
        prefix: `HT-${year}`, year, sequence: i,
        contractNo: `${prefix}-${String(i).padStart(5, '0')}`,
        status: i <= 10 ? NumberPoolStatus.USED : (i <= 15 ? NumberPoolStatus.RESERVED : NumberPoolStatus.AVAILABLE),
      });
      await numberPoolRepo.save(np);
    }
  }

  await dataSource.destroy();
  console.log('✅ 种子数据初始化完成！');
}

function Not(val: any) {
  return { $ne: val } as any;
}

run().catch(e => {
  console.error('❌ 种子数据失败:', e);
  process.exit(1);
});
