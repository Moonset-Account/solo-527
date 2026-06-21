import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus, UserDepartment } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { UserRole } from '../../entities/user-role.entity';
import { Contract, ContractStatus, ContractType, UrgencyLevel } from '../../entities/contract.entity';
import { ContractAttachment, AttachmentType, AttachmentStatus } from '../../entities/contract-attachment.entity';
import { ApprovalFlow, ApprovalStatus, ApprovalNodeType } from '../../entities/approval-flow.entity';
import { ConflictRecord, ConflictType, ConflictSeverity, ConflictStatus } from '../../entities/conflict-record.entity';
import { Notification, NotificationType, NotificationChannel, NotificationStatus } from '../../entities/notification.entity';
import { CallbackLog, CallbackType, CallbackStatus } from '../../entities/callback-log.entity';
import { ContractNumberPool, NumberPoolStatus } from '../../entities/contract-number-pool.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private testUsers: User[] = [];
  private testContracts: Contract[] = [];
  private adminUser: User;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(ContractAttachment) private attachmentRepo: Repository<ContractAttachment>,
    @InjectRepository(ApprovalFlow) private approvalRepo: Repository<ApprovalFlow>,
    @InjectRepository(ConflictRecord) private conflictRepo: Repository<ConflictRecord>,
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
    @InjectRepository(CallbackLog) private callbackRepo: Repository<CallbackLog>,
    @InjectRepository(ContractNumberPool) private numberPoolRepo: Repository<ContractNumberPool>,
  ) {}

  async onModuleInit() {
    try {
      await this.seedAll();
    } catch (e) {
      console.log('⚠️  种子数据跳过:', e.message);
    }
  }

  private async seedAll() {
    const contractCount = await this.contractRepo.count();
    const conflictCount = await this.conflictRepo.count();
    const callbackCount = await this.callbackRepo.count();
    
    if (contractCount > 0 && conflictCount > 0 && callbackCount > 0) {
      console.log('✅ 种子数据已存在，跳过初始化');
      return;
    }

    console.log('🌱 开始初始化测试数据...');

    if (contractCount === 0) {
      await this.createTestUsers();
      await this.createTestContracts();
      await this.createTestApprovals();
      await this.createTestAttachments();
      await this.createTestNotifications();
      await this.createTestNumberPool();
    } else {
      const admin = await this.userRepo.findOne({ where: { username: 'admin' } });
      if (admin) this.adminUser = admin;
      this.testContracts = await this.contractRepo.find({ take: 10 });
      this.testUsers = await this.userRepo.find({ where: { username: Not('admin') } });
    }
    
    if (conflictCount === 0) {
      await this.createTestConflicts();
    }
    
    if (callbackCount === 0) {
      await this.createTestCallbacks();
    }

    console.log('✅ 种子数据初始化完成');
    console.log(`   - 测试用户: ${this.testUsers.length + 1} 人`);
    console.log(`   - 测试合同: ${this.testContracts.length} 份`);
    console.log('   📱 手机快速查看审批: /m/progress/:contractId');
    console.log('   🔍 材料筛选: 材料完整/不完整/含退回原因');
  }

  private async createTestUsers() {
    const admin = await this.userRepo.findOne({ where: { username: 'admin' } });
    if (admin) this.adminUser = admin;

    const userProfiles = [
      { username: 'zhangwei', realName: '张伟', email: 'zhangwei@legal.com', phone: '13800000001', department: UserDepartment.LEGAL, role: 'legal_admin' },
      { username: 'liming', realName: '李明', email: 'liming@finance.com', phone: '13800000002', department: UserDepartment.FINANCE, role: 'finance_reviewer' },
      { username: 'wangfang', realName: '王芳', email: 'wangfang@biz.com', phone: '13800000003', department: UserDepartment.BUSINESS, role: 'contract_applicant' },
      { username: 'chenjie', realName: '陈杰', email: 'chenjie@hr.com', phone: '13800000004', department: UserDepartment.HR, role: 'contract_applicant' },
      { username: 'liuhong', realName: '刘红', email: 'liuhong@legal.com', phone: '13800000005', department: UserDepartment.LEGAL, role: 'legal_reviewer' },
    ];

    const hashed = await bcrypt.hash('123456', 10);

    for (const up of userProfiles) {
      let user = await this.userRepo.findOne({ where: { username: up.username } });
      if (!user) {
        user = this.userRepo.create({
          ...up,
          password: hashed,
          status: UserStatus.ACTIVE,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${up.realName}`,
        });
        user = await this.userRepo.save(user);
      }
      this.testUsers.push(user);

      let role = await this.roleRepo.findOne({ where: { code: up.role } });
      if (!role) {
        const roleNames: Record<string, string> = {
          legal_admin: '法务主管',
          finance_reviewer: '财务审核',
          contract_applicant: '合同申请人',
          legal_reviewer: '法务审核',
        };
        role = this.roleRepo.create({
          code: up.role,
          name: roleNames[up.role] || up.role,
          description: `系统预置角色: ${roleNames[up.role] || up.role}`,
          enabled: true,
        });
        role = await this.roleRepo.save(role);
      }

      const existingUR = await this.userRoleRepo.findOne({ where: { userId: user.id, roleId: role.id } });
      if (!existingUR) {
        const ur = this.userRoleRepo.create({ userId: user.id, roleId: role.id });
        await this.userRoleRepo.save(ur);
      }
    }
  }

  private async createTestContracts() {
    const now = new Date();
    const contractsData = [
      {
        title: '2024年度供应商框架采购合同',
        contractType: ContractType.PURCHASE,
        partyA: '北京科技有限公司',
        partyB: '上海供应链管理有限公司',
        amount: 5800000,
        urgency: UrgencyLevel.VERY_URGENT,
        status: ContractStatus.APPROVING,
        materialsComplete: true,
        summary: '2024年度生产原材料集中采购框架协议，涵盖12大类56小类物料',
      },
      {
        title: '软件开发服务外包合同',
        contractType: ContractType.SERVICE,
        partyA: '北京科技有限公司',
        partyB: '深圳软件技术有限公司',
        amount: 1280000,
        urgency: UrgencyLevel.NORMAL,
        status: ContractStatus.DRAFT,
        materialsComplete: false,
        summary: 'ERP系统二期开发外包服务，周期6个月',
      },
      {
        title: '办公楼租赁合同',
        contractType: ContractType.OTHER,
        partyA: '北京科技有限公司',
        partyB: '万达商业管理集团',
        amount: 8600000,
        urgency: UrgencyLevel.URGENT,
        status: ContractStatus.REJECTED,
        materialsComplete: true,
        rejectionReason: '1. 租金单价高于市场均价8%\n2. 免租期仅1个月，要求3个月\n3. 违约条款不对等',
        summary: '望京SOHO T3座 15层整层租赁，租期5年',
      },
      {
        title: '设备采购合同',
        contractType: ContractType.PURCHASE,
        partyA: '北京科技有限公司',
        partyB: '戴尔(中国)有限公司',
        amount: 450000,
        urgency: UrgencyLevel.NORMAL,
        status: ContractStatus.SIGNED,
        materialsComplete: true,
        summary: '采购200台笔记本电脑、30台服务器',
      },
      {
        title: '技术合作框架协议',
        contractType: ContractType.COOPERATION,
        partyA: '北京科技有限公司',
        partyB: '清华大学人工智能研究院',
        amount: 3200000,
        urgency: UrgencyLevel.NORMAL,
        status: ContractStatus.ARCHIVED,
        materialsComplete: true,
        summary: 'AI大模型联合研发合作，知识产权共享',
      },
      {
        title: '劳动聘用合同-张晓明',
        contractType: ContractType.LABOR,
        partyA: '北京科技有限公司',
        partyB: '张晓明',
        amount: 480000,
        urgency: UrgencyLevel.URGENT,
        status: ContractStatus.APPROVING,
        materialsComplete: false,
        summary: '技术总监岗位聘用合同，年薪48万+期权',
      },
      {
        title: '市场推广服务合同',
        contractType: ContractType.SERVICE,
        partyA: '北京科技有限公司',
        partyB: '奥美广告有限公司',
        amount: 2500000,
        urgency: UrgencyLevel.NORMAL,
        status: ContractStatus.APPROVING,
        materialsComplete: true,
        summary: '2024年Q3-Q4品牌推广全案服务',
      },
      {
        title: '咨询服务合同',
        contractType: ContractType.SERVICE,
        partyA: '北京科技有限公司',
        partyB: '麦肯锡咨询有限公司',
        amount: 6800000,
        urgency: UrgencyLevel.VERY_URGENT,
        status: ContractStatus.DRAFT,
        materialsComplete: false,
        summary: '数字化转型战略咨询项目，周期12个月',
      },
      {
        title: 'NDA保密协议',
        contractType: ContractType.CONFIDENTIAL,
        partyA: '北京科技有限公司',
        partyB: '潜在战略投资者',
        amount: 0,
        urgency: UrgencyLevel.VERY_URGENT,
        status: ContractStatus.SIGNED,
        materialsComplete: true,
        summary: 'D轮融资尽职调查保密协议',
      },
      {
        title: '原材料采购合同',
        contractType: ContractType.PURCHASE,
        partyA: '北京科技有限公司',
        partyB: '唐山钢铁集团',
        amount: 12500000,
        urgency: UrgencyLevel.URGENT,
        status: ContractStatus.PENDING,
        materialsComplete: true,
        summary: 'Q3生产用特种钢材5000吨采购合同',
      },
    ];

    for (let i = 0; i < contractsData.length; i++) {
      const data = contractsData[i];
      const applicant = this.testUsers[i % this.testUsers.length];
      const owner = this.testUsers[(i + 2) % this.testUsers.length];

      const year = now.getFullYear();
      const seqNo = i + 1;
      const contractNo = `HT-${year}-${String(seqNo).padStart(5, '0')}`;

      const contract = this.contractRepo.create({
        ...data,
        contractNo,
        applicantId: applicant.id,
        ownerId: owner.id,
        currency: 'CNY',
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

      const saved = await this.contractRepo.save(contract);
      this.testContracts.push(saved);
    }
  }

  private async createTestApprovals() {
    for (const contract of this.testContracts) {
      const approvers = [this.testUsers[4], this.testUsers[1], this.adminUser].filter(Boolean);

      if (contract.status === ContractStatus.APPROVING || contract.status === ContractStatus.PENDING) {
        for (let i = 0; i < approvers.length; i++) {
          const approver = approvers[i];
          const status = i === 0 ? ApprovalStatus.APPROVED : (i === 1 ? ApprovalStatus.PENDING : ApprovalStatus.PENDING);

          const approval = this.approvalRepo.create({
            contractId: contract.id,
            approverId: approver.id,
            nodeName: ['法务审核', '财务审核', '最终审批'][i],
            nodeType: ApprovalNodeType.SINGLE,
            stepOrder: i + 1,
            status,
            approvedAt: status === ApprovalStatus.APPROVED ? new Date() : null,
            opinion: status === ApprovalStatus.APPROVED ? '已审核，材料完整' : null,
            signature: status === ApprovalStatus.APPROVED ? { sign: `SIGN_${contract.id}_${approver.id}` } : null,
            durationHours: status === ApprovalStatus.APPROVED ? Math.floor(Math.random() * 24 + 2) : null,
          });
          await this.approvalRepo.save(approval);
        }
      } else if (contract.status === ContractStatus.REJECTED) {
        const approval = this.approvalRepo.create({
          contractId: contract.id,
          approverId: this.testUsers[1].id,
          nodeName: '财务审核',
          nodeType: ApprovalNodeType.SINGLE,
          stepOrder: 2,
          status: ApprovalStatus.REJECTED,
          rejectionReason: contract.rejectionReason,
          durationHours: 5.5,
          signature: null,
        });
        await this.approvalRepo.save(approval);

        for (let i = 0; i < 1; i++) {
          const approver = this.testUsers[i];
          const approval2 = this.approvalRepo.create({
            contractId: contract.id,
            approverId: approver.id,
            nodeName: ['法务审核'][i],
            nodeType: ApprovalNodeType.SINGLE,
            stepOrder: i + 1,
            status: ApprovalStatus.APPROVED,
            approvedAt: new Date(Date.now() - 86400000),
            opinion: '合同内容合法',
            durationHours: 4,
            signature: { sign: `SIGN_${contract.id}_${approver.id}` },
          });
          await this.approvalRepo.save(approval2);
        }
      } else if (contract.status === ContractStatus.SIGNED || contract.status === ContractStatus.ARCHIVED) {
        for (let i = 0; i < approvers.length; i++) {
          const approver = approvers[i];
          const approval = this.approvalRepo.create({
            contractId: contract.id,
            approverId: approver.id,
            nodeName: ['法务审核', '财务审核', '最终审批'][i],
            nodeType: ApprovalNodeType.SINGLE,
            stepOrder: i + 1,
            status: ApprovalStatus.APPROVED,
            approvedAt: new Date(Date.now() - (approvers.length - i) * 86400000),
            opinion: ['合同内容审核通过', '预算内，同意', '终审通过'][i],
            durationHours: Math.random() * 12 + 1,
            signature: { sign: `SIGN_${contract.id}_${approver.id}` },
          });
          await this.approvalRepo.save(approval);
        }
      }
    }
  }

  private async createTestAttachments() {
    const attachmentNames = ['合同正文.pdf', '营业执照副本.jpg', '授权委托书.pdf', '报价单.xlsx', '审批单.pdf'];
    const types = [AttachmentType.CONTRACT_MAIN, AttachmentType.BUSINESS_LICENSE, AttachmentType.PROOF, AttachmentType.OTHER, AttachmentType.OTHER];

    for (const contract of this.testContracts) {
      const count = contract.materialsComplete ? 5 : 2;
      for (let i = 0; i < count; i++) {
        const attachment = this.attachmentRepo.create({
          contractId: contract.id,
          originalName: attachmentNames[i],
          attachmentType: types[i],
          status: i < 3 ? AttachmentStatus.VERIFIED : AttachmentStatus.UPLOADED,
          mimeType: ['application/pdf', 'image/jpeg', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'][i],
          fileSize: (i + 1) * 128000 + Math.floor(Math.random() * 500000),
          filePath: `/uploads/${contract.id}/${attachmentNames[i]}`,
          uploaderId: contract.applicantId,
          permissionConfig: {
            public: i < 3,
            viewRoles: ['legal_admin', 'legal_reviewer'],
            downloadRoles: ['legal_admin'],
            viewUsers: [],
            downloadUsers: [],
          },
          viewCount: Math.floor(Math.random() * 50),
          downloadCount: Math.floor(Math.random() * 20),
        });
        await this.attachmentRepo.save(attachment);
      }
    }
  }

  private async createTestConflicts() {
    const contract1 = this.testContracts[2];
    const contract2 = this.testContracts[4];

    const conflict1 = this.conflictRepo.create({
      contractId: contract1.id,
      title: '租赁合同资源冲突',
      description: '该办公楼层同时与两家公司进行租赁洽谈，存在资源抢占风险',
      conflictType: ConflictType.DATE_OVERLAP,
      severity: ConflictSeverity.HIGH,
      status: ConflictStatus.ASSIGNED,
      impactScope: '影响范围：\n1. 望京SOHO T3-15层 2800平米办公空间\n2. 预计影响200人团队搬迁计划\n3. 涉及预算860万元/年\n4. 若冲突升级可能导致法务诉讼',
      handlerId: this.adminUser?.id,
      affectedResources: '办公楼层租赁权 / 优先签约权',
      nextSteps: '下一步计划：\n1. 24小时内与对方公司沟通协商\n2. 启动备选方案：联系绿地中心同面积楼层\n3. 评估违约成本，若低于100万可考虑转签\n4. 本周内给出最终解决方案',
      reporterId: this.testUsers[0].id,
      timeline: [
        { time: new Date(Date.now() - 7200000), actor: this.testUsers[0].realName, action: '冲突发现', remark: '发现同一楼层存在重复洽谈' },
        { time: new Date(Date.now() - 3600000), actor: '系统', action: '受理分派', remark: '自动分派给系统管理员处理' },
      ],
    });
    await this.conflictRepo.save(conflict1);

    const conflict2 = this.conflictRepo.create({
      contractId: contract2.id,
      title: '知识产权归属争议',
      description: '合作协议中关于AI模型知识产权的描述存在歧义，双方解读不一致',
      conflictType: ConflictType.AMOUNT_DISCREPANCY,
      severity: ConflictSeverity.MEDIUM,
      status: ConflictStatus.RESOLVED,
      impactScope: '影响范围：\n1. 合作研发的AI模型知识产权归属\n2. 后续商业化收益分配比例\n3. 技术成果论文发表署名权',
      handlerId: this.testUsers[0].id,
      affectedResources: 'AI模型知识产权 / 论文署名权 / 商业化收益',
      nextSteps: '已完成：\n1. 补充条款明确：算法模型知识产权双方共有\n2. 商用收益按7:3分配（我方70%）\n3. 论文署名按贡献度排序',
      resolution: '通过签署补充协议明确知识产权归属，双方已签字确认',
      reporterId: this.testUsers[2].id,
      timeline: [
        { time: new Date(Date.now() - 86400000), actor: this.testUsers[2].realName, action: '冲突上报', remark: '协议条款存在歧义' },
        { time: new Date(Date.now() - 43200000), actor: this.testUsers[0].realName, action: '协商沟通', remark: '与清华研究院法务沟通' },
        { time: new Date(Date.now() - 7200000), actor: this.testUsers[0].realName, action: '冲突解决', remark: '签署补充协议，争议解决' },
      ],
      resolvedAt: new Date(Date.now() - 7200000),
    });
    await this.conflictRepo.save(conflict2);

    const conflict3 = this.conflictRepo.create({
      title: '编号池资源不足',
      description: '2024年度合同编号即将用尽，剩余可用编号不足100个',
      conflictType: ConflictType.NUMBER_CONFLICT,
      severity: ConflictSeverity.LOW,
      status: ConflictStatus.OPEN,
      impactScope: '影响范围：\n1. 可能影响Q4新合同签约编号生成\n2. 涉及2024年度全部新签合同',
      handlerId: this.adminUser?.id,
      affectedResources: '2024年度编号池',
      nextSteps: '下一步计划：\n1. 扩大编号池容量至10000\n2. 清理过期预留编号释放资源',
      reporterId: this.testUsers[0].id,
      timeline: [
        { time: new Date(Date.now() - 3600000), actor: '系统', action: '系统告警', remark: '编号池资源使用率超过90%' },
      ],
    });
    await this.conflictRepo.save(conflict3);
  }

  private async createTestNotifications() {
    const contract1 = this.testContracts[0];
    const contract2 = this.testContracts[2];

    const notifications = [
      {
        recipientId: this.testUsers[0].id,
        recipientTarget: this.testUsers[0].email,
        type: NotificationType.MATERIAL_COMPLETE,
        channel: NotificationChannel.IN_APP,
        title: '合同材料已完整',
        content: `【${contract1.contractNo}】${contract1.title} 材料已完整，请及时处理。`,
        relatedData: { contractId: contract1.id },
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      },
      {
        recipientId: this.testUsers[0].id,
        recipientTarget: this.testUsers[0].phone,
        type: NotificationType.MATERIAL_COMPLETE,
        channel: NotificationChannel.SMS,
        title: '合同材料已完整',
        content: `【${contract1.contractNo}】材料已完整，请登录系统处理`,
        relatedData: { contractId: contract1.id },
        status: NotificationStatus.FAILED,
        failureReason: '短信服务暂不可用: 账户余额不足',
        retryCount: 3,
      },
      {
        recipientId: this.testUsers[2].id,
        recipientTarget: this.testUsers[2].email,
        type: NotificationType.CONTRACT_REJECTED,
        channel: NotificationChannel.EMAIL,
        title: '合同审批被退回',
        content: `【${contract2.contractNo}】${contract2.title} 审批不通过，请查看退回原因并修改。`,
        relatedData: { contractId: contract2.id },
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      },
      {
        recipientId: this.testUsers[1].id,
        type: NotificationType.APPROVAL_REQUEST,
        channel: NotificationChannel.IN_APP,
        title: '待您审批',
        content: `有1份合同待您审批：【${contract1.contractNo}】${contract1.title}`,
        relatedData: { contractId: contract1.id },
        status: NotificationStatus.PENDING,
      },
      {
        recipientId: this.testUsers[4].id,
        type: NotificationType.CONFLICT_CREATED,
        channel: NotificationChannel.IN_APP,
        title: '资源冲突告警',
        content: `检测到新的资源冲突，请登录系统处理。`,
        relatedData: {},
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      },
    ];

    for (const n of notifications) {
      const notification = this.notificationRepo.create(n);
      await this.notificationRepo.save(notification);
    }
  }

  private async createTestCallbacks() {
    const contract = this.testContracts[0];
    const now = new Date();

    const callbacks = [
      {
        requestId: 'CB-' + Date.now() + '-001',
        callbackType: CallbackType.WEBHOOK,
        targetUrl: 'https://webhook.example.com/approval',
        requestPayload: JSON.stringify({ contractId: contract.id, contractNo: contract.contractNo, status: 'approved' }),
        requestHeaders: { 'X-Signature': 'sha256=xxx', 'Content-Type': 'application/json' },
        status: CallbackStatus.SUCCESS,
        responseStatusCode: 200,
        responseBody: JSON.stringify({ code: 0, message: 'ok' }),
        durationMs: 235,
        relatedId: contract.id,
        relatedType: 'contract',
        firstAttemptAt: now,
        lastAttemptAt: now,
        completedAt: now,
      },
      {
        requestId: 'CB-' + Date.now() + '-002',
        callbackType: CallbackType.PAYMENT,
        targetUrl: 'https://payment-gateway.example.com/notify',
        requestPayload: JSON.stringify({ orderId: 'PAY20240601001', amount: 5800000, status: 'success' }),
        requestHeaders: { 'X-Signature': 'sha256=abc123' },
        status: CallbackStatus.RETRYING,
        failureReason: '对方服务返回503 Service Unavailable',
        nextRetryAt: new Date(now.getTime() + 120000),
        retryCount: 2,
        maxRetryCount: 5,
        relatedId: contract.id,
        relatedType: 'contract',
        firstAttemptAt: new Date(now.getTime() - 120000),
        lastAttemptAt: new Date(now.getTime() - 60000),
        retryHistory: [
          { attempt: 1, time: new Date(now.getTime() - 120000), status: 'failed', statusCode: 503, error: '503 Service Unavailable', durationMs: 5000 },
          { attempt: 2, time: new Date(now.getTime() - 60000), status: 'failed', statusCode: 503, error: '503 Service Unavailable', durationMs: 5000 },
        ],
      },
      {
        requestId: 'CB-' + Date.now() + '-003',
        callbackType: CallbackType.ESIGN,
        targetUrl: 'https://esign.example.com/callback',
        requestPayload: JSON.stringify({ contractId: contract.id, sealResult: 'success' }),
        requestHeaders: {},
        status: CallbackStatus.PENDING,
        relatedId: contract.id,
        relatedType: 'contract',
        firstAttemptAt: now,
      },
      {
        requestId: 'CB-' + Date.now() + '-004',
        callbackType: CallbackType.PAYMENT,
        targetUrl: 'https://payment-gateway.example.com/notify',
        requestPayload: JSON.stringify({ orderId: 'PAY20240602002', amount: 1280000 }),
        requestHeaders: { 'X-Signature': 'sha256=def456' },
        status: CallbackStatus.FAILED,
        failureReason: '连续重试5次均失败，已放弃。最后错误：400 Bad Request - 签名验证失败',
        retryCount: 5,
        maxRetryCount: 5,
        relatedId: contract.id,
        relatedType: 'contract',
        firstAttemptAt: new Date(now.getTime() - 300000),
        lastAttemptAt: new Date(now.getTime() - 60000),
        retryHistory: [
          { attempt: 1, time: new Date(now.getTime() - 300000), status: 'failed', statusCode: 400, error: '签名验证失败', durationMs: 150 },
          { attempt: 2, time: new Date(now.getTime() - 240000), status: 'failed', statusCode: 400, error: '签名验证失败', durationMs: 120 },
          { attempt: 3, time: new Date(now.getTime() - 180000), status: 'failed', statusCode: 400, error: '签名验证失败', durationMs: 110 },
          { attempt: 4, time: new Date(now.getTime() - 120000), status: 'failed', statusCode: 400, error: '签名验证失败', durationMs: 130 },
          { attempt: 5, time: new Date(now.getTime() - 60000), status: 'failed', statusCode: 400, error: '签名验证失败', durationMs: 140 },
        ],
      },
    ];

    for (const c of callbacks) {
      const callback = this.callbackRepo.create(c);
      await this.callbackRepo.save(callback);
    }
  }

  private async createTestNumberPool() {
    const year = new Date().getFullYear();
    for (let i = 1; i <= 20; i++) {
      let status = NumberPoolStatus.AVAILABLE;
      if (i <= 10) status = NumberPoolStatus.USED;
      else if (i <= 13) status = NumberPoolStatus.RESERVED;
      else if (i <= 15) status = NumberPoolStatus.EXPIRED;

      const pool = this.numberPoolRepo.create({
        prefix: 'HT',
        year,
        seqNo: i,
        contractNo: `HT-${year}-${String(i).padStart(5, '0')}`,
        status,
        ruleType: 'standard',
        reservedExpireAt: status === NumberPoolStatus.RESERVED ? new Date(Date.now() + 86400000) : null,
        appliedBy: status === NumberPoolStatus.RESERVED ? this.testUsers[0].id : null,
        usedAt: status === NumberPoolStatus.USED ? new Date() : null,
        contractId: status === NumberPoolStatus.USED && this.testContracts[i - 1] ? this.testContracts[i - 1].id : null,
      });
      await this.numberPoolRepo.save(pool);
    }
  }
}
