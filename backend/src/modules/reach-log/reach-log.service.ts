import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReachLog, ReachLogDocument } from './reach-log.schema';
import { ReachType, ReachStatus } from '../../common/enums';
import { DEFAULT_MEMBERS } from '../../common/constants/default-members';

@Injectable()
export class ReachLogService {
  constructor(@InjectModel(ReachLog.name) private reachLogModel: Model<ReachLogDocument>) {
    this.initDefaultData();
  }

  async initDefaultData() {
    const count = await this.reachLogModel.countDocuments();
    if (count === 0) {
      const now = new Date();
      const types = [ReachType.SMS, ReachType.WECHAT, ReachType.APP_PUSH];
      const statuses = [ReachStatus.SUCCESS, ReachStatus.FAILED, ReachStatus.SUCCESS, ReachStatus.SUCCESS, ReachStatus.FAILED];
      const failReasons = ['用户手机关机', '短信网关超时', '用户未关注公众号', 'APP推送权限未开启', '网络异常'];
      const templates = [
        { name: '生日祝福模板', id: 'TPL001' },
        { name: '优惠券到账通知', id: 'TPL002' },
        { name: '活动邀请', id: 'TPL003' },
        { name: '积分到期提醒', id: 'TPL004' },
        { name: '会员升级通知', id: 'TPL005' },
      ];
      const operators = ['小王', '小李', '系统自动'];

      const records = [];
      for (let i = 0; i < 25; i++) {
        const member = DEFAULT_MEMBERS[Math.floor(Math.random() * DEFAULT_MEMBERS.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const tpl = templates[Math.floor(Math.random() * templates.length)];
        const statusIdx = Math.floor(Math.random() * statuses.length);
        const status = statuses[statusIdx];
        const sendTime = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 3600 * 1000);

        records.push({
          logNo: `RL${Date.now()}${i.toString().padStart(5, '0')}`,
          type,
          memberId: new Types.ObjectId(member._id),
          memberName: member.name,
          memberPhone: member.phone,
          templateId: tpl.id,
          templateName: tpl.name,
          content: `${member.name}您好，${tpl.name.replace('模板', '')}，详情请查看。`,
          status,
          failReason: status === ReachStatus.FAILED ? failReasons[Math.floor(Math.random() * failReasons.length)] : undefined,
          failCode: status === ReachStatus.FAILED ? `ERR${1000 + i}` : undefined,
          provider: ['阿里云短信', '微信公众号', '个推'][Math.floor(Math.random() * 3)],
          providerMsgId: status === ReachStatus.SUCCESS ? `MSG${Math.floor(Math.random() * 100000)}` : undefined,
          storeId: 'store001',
          storeName: '青禾美妆-南京路店',
          operatorName: operators[Math.floor(Math.random() * operators.length)],
          sendTime,
          receiveTime: status === ReachStatus.SUCCESS ? new Date(sendTime.getTime() + Math.floor(Math.random() * 60) * 1000) : undefined,
          envLabel: process.env.ENV_LABEL || 'dev',
          createdAt: sendTime,
        });
      }
      await this.reachLogModel.create(records);
      console.log('✅ 默认触达日志已创建');
    }
    await this.fixMemberReferences();
  }

  async fixMemberReferences() {
    const phoneMap = new Map(DEFAULT_MEMBERS.map(m => [m.phone, new Types.ObjectId(m._id)]));
    const nameMap = new Map(DEFAULT_MEMBERS.map(m => [m.name, new Types.ObjectId(m._id)]));
    const records = await this.reachLogModel.find({});
    const bulk = this.reachLogModel.collection.initializeUnorderedBulkOp();
    let changed = 0;
    for (const r of records) {
      const targetId = phoneMap.get(r.memberPhone) || nameMap.get(r.memberName);
      if (targetId && !r.memberId?.equals(targetId)) {
        bulk.find({ _id: r._id }).updateOne({ $set: { memberId: targetId } });
        changed++;
      }
    }
    if (changed > 0) {
      await bulk.execute();
      console.log(`🔧 触达日志会员ID纠偏完成，更新 ${changed} 条`);
    }
  }

  async findAll(params: any = {}) {
    const { page = 1, pageSize = 20, keyword, type, status, startDate, endDate, storeId, envLabel, operatorName } = params;
    const query: any = {};

    if (keyword) {
      query.$or = [
        { memberName: { $regex: keyword, $options: 'i' } },
        { memberPhone: { $regex: keyword } },
        { logNo: { $regex: keyword } },
        { templateName: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.sendTime = {};
      if (startDate) query.sendTime.$gte = new Date(startDate);
      if (endDate) query.sendTime.$lte = new Date(endDate + 'T23:59:59');
    }
    if (storeId) query.storeId = storeId;
    if (envLabel) query.envLabel = envLabel;
    if (operatorName) query.operatorName = { $regex: operatorName, $options: 'i' };

    const [list, total] = await Promise.all([
      this.reachLogModel.find(query).sort({ sendTime: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      this.reachLogModel.countDocuments(query),
    ]);
    return { list, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findById(id: string) {
    return this.reachLogModel.findById(id);
  }

  async create(data: Partial<ReachLog>) {
    const record = await this.reachLogModel.create({
      ...data,
      envLabel: data.envLabel || process.env.ENV_LABEL || 'dev',
    });
    return record;
  }

  async updateStatus(id: string, status: ReachStatus, data: any = {}) {
    return this.reachLogModel.findByIdAndUpdate(id, { status, ...data }, { new: true });
  }

  async getStats() {
    const total = await this.reachLogModel.countDocuments();
    const byType = await this.reachLogModel.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const byStatus = await this.reachLogModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const failedCount = await this.reachLogModel.countDocuments({ status: ReachStatus.FAILED });
    return { total, byType, byStatus, failedCount };
  }

  async getFailedLogs(params: any = {}) {
    return this.findAll({ ...params, status: ReachStatus.FAILED });
  }
}
