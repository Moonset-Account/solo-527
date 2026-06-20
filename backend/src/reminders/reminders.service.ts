import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { Reminder, ReminderDocument } from './schemas/reminder.schema';
import { ReminderConfig, ReminderConfigDocument, ReminderTrigger } from './schemas/reminder-config.schema';
import { ReminderType } from '../common/enums/reminder-type.enum';
import { SearchDto } from '../common/dto/search.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { Interview } from '../interviews/schemas/interview.schema';
import { InterviewStatus } from '../common/enums/interview-status.enum';
import { User } from '../users/schemas/user.schema';
import { Role } from '../common/enums/role.enum';
import { Schedule, ScheduleStatus } from '../interviewers/schemas/schedule.schema';
import { Assessment } from '../assessments/schemas/assessment.schema';

@Injectable()
export class RemindersService implements OnModuleInit {
  constructor(
    @InjectModel(Reminder.name) private reminderModel: Model<ReminderDocument>,
    @InjectModel(ReminderConfig.name) private reminderConfigModel: Model<ReminderConfigDocument>,
    @InjectModel(Interview.name) private interviewModel: Model<any>,
    @InjectModel(User.name) private userModel: Model<any>,
    @InjectModel(Schedule.name) private scheduleModel: Model<any>,
    @InjectModel(Assessment.name) private assessmentModel: Model<any>,
  ) {}

  async onModuleInit() {
    await this.initDefaultConfigs();
  }

  async initDefaultConfigs() {
    const count = await this.reminderConfigModel.countDocuments().exec();
    if (count > 0) return;

    const defaultConfigs = [
      {
        name: '面试前30分钟提醒',
        trigger: ReminderTrigger.TIME_BEFORE_INTERVIEW,
        type: ReminderType.INFO,
        config: {
          timeThresholdMinutes: 30,
          blocking: false,
        },
        targetRoles: [Role.ADMIN, Role.HR, Role.INTERVIEWER],
        description: '面试开始前30分钟发送普通提醒',
        enabled: true,
        sortOrder: 1,
      },
      {
        name: '面试前10分钟警告',
        trigger: ReminderTrigger.TIME_BEFORE_INTERVIEW,
        type: ReminderType.WARNING,
        config: {
          timeThresholdMinutes: 10,
          blocking: false,
        },
        targetRoles: [Role.ADMIN, Role.HR, Role.INTERVIEWER],
        description: '面试开始前10分钟发送警告提醒',
        enabled: true,
        sortOrder: 2,
      },
      {
        name: '面试时间不足阻断',
        trigger: ReminderTrigger.TIME_BEFORE_INTERVIEW,
        type: ReminderType.BLOCKING,
        config: {
          timeThresholdMinutes: 5,
          blocking: true,
        },
        targetRoles: [Role.ADMIN, Role.HR],
        description: '面试前5分钟仍未签到，发送阻断告警',
        enabled: true,
        sortOrder: 3,
      },
      {
        name: '每日日程提醒',
        trigger: ReminderTrigger.DAILY_SCHEDULE,
        type: ReminderType.INFO,
        config: {
          dailyTime: '08:00',
          blocking: false,
        },
        targetRoles: [Role.ADMIN, Role.HR, Role.INTERVIEWER],
        description: '每天早上8点发送当日面试日程提醒',
        enabled: true,
        sortOrder: 4,
      },
      {
        name: '未签到提醒',
        trigger: ReminderTrigger.NO_CHECKIN,
        type: ReminderType.WARNING,
        config: {
          checkInGraceMinutes: 15,
          blocking: false,
        },
        targetRoles: [Role.ADMIN, Role.HR],
        description: '面试开始后15分钟仍未签到，发送警告',
        enabled: true,
        sortOrder: 5,
      },
      {
        name: '未完成测评提醒',
        trigger: ReminderTrigger.NO_ASSESSMENT,
        type: ReminderType.WARNING,
        config: {
          assessmentDeadlineHours: 2,
          blocking: false,
        },
        targetRoles: [Role.ADMIN, Role.HR, Role.INTERVIEWER],
        description: '面试结束后2小时未完成测评，发送警告',
        enabled: true,
        sortOrder: 6,
      },
      {
        name: '面试官档期不足警告',
        trigger: ReminderTrigger.INTERVIEWER_QUOTA,
        type: ReminderType.WARNING,
        config: {
          quotaWarningPercentage: 80,
          blocking: false,
        },
        targetRoles: [Role.ADMIN, Role.HR],
        description: '面试官月度档期使用超过80%时警告',
        enabled: true,
        sortOrder: 7,
      },
      {
        name: '面试官档期不足阻断',
        trigger: ReminderTrigger.INTERVIEWER_QUOTA,
        type: ReminderType.BLOCKING,
        config: {
          quotaWarningPercentage: 100,
          blocking: true,
        },
        targetRoles: [Role.ADMIN],
        description: '面试官月度档期已满时发送阻断告警',
        enabled: true,
        sortOrder: 8,
      },
    ];

    for (const config of defaultConfigs) {
      const reminderConfig = new this.reminderConfigModel(config);
      await reminderConfig.save();
    }

    console.log('默认提醒配置已初始化');
  }

  async createReminder(
    userId: string,
    type: ReminderType,
    title: string,
    content: string,
    metadata?: any,
    configId?: string,
  ): Promise<Reminder> {
    const reminder = new this.reminderModel({
      userId: new Types.ObjectId(userId),
      type,
      title,
      content,
      metadata,
      configId: configId ? new Types.ObjectId(configId) : undefined,
    });
    return reminder.save();
  }

  async findByUserId(userId: string, searchDto: SearchDto): Promise<PaginatedResult<Reminder>> {
    const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc', type, types } = searchDto;

    const filter: any = {
      userId: new Types.ObjectId(userId),
    };

    if (type) {
      filter.type = type;
    }

    if (types && types.length > 0) {
      filter.type = { $in: types };
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [data, total] = await Promise.all([
      this.reminderModel
        .find(filter)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.reminderModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.reminderModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    }).exec();
  }

  async markAsRead(id: string, userId: string): Promise<Reminder> {
    const reminder = await this.reminderModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!reminder) {
      throw new NotFoundException('提醒不存在');
    }

    reminder.isRead = true;
    reminder.readAt = new Date();
    return reminder.save();
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.reminderModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    ).exec();
    return result.modifiedCount;
  }

  async findAllConfigs(): Promise<ReminderConfig[]> {
    return this.reminderConfigModel.find().sort({ sortOrder: 1 }).exec();
  }

  async updateConfig(id: string, updateData: any): Promise<ReminderConfig> {
    const config = await this.reminderConfigModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!config) {
      throw new NotFoundException('提醒配置不存在');
    }

    return config;
  }

  async getBlockingReminders(userId: string): Promise<Reminder[]> {
    return this.reminderModel.find({
      userId: new Types.ObjectId(userId),
      type: ReminderType.BLOCKING,
      isRead: false,
    }).sort({ createdAt: -1 }).exec();
  }

  @Cron('*/5 * * * *')
  async checkInterviewReminders() {
    const now = new Date();
    const enabledConfigs = await this.reminderConfigModel.find({
      enabled: true,
      trigger: ReminderTrigger.TIME_BEFORE_INTERVIEW,
    }).exec();

    for (const config of enabledConfigs) {
      const thresholdMinutes = config.config.timeThresholdMinutes || 30;
      const checkTime = new Date(now.getTime() + thresholdMinutes * 60 * 1000);
      const checkTimeEnd = new Date(checkTime.getTime() + 5 * 60 * 1000);

      const interviews = await this.interviewModel.find({
        interviewDate: { $gte: checkTime, $lt: checkTimeEnd },
        status: { $in: [InterviewStatus.SCHEDULED, InterviewStatus.CONFIRMED] },
      }).populate('interviewerId').exec();

      for (const interview of interviews) {
        const reminderKey = `interview_${interview._id}_${config._id}_${checkTime.toDateString()}`;
        const existing = await this.reminderModel.findOne({
          'metadata.recordId': interview._id.toString(),
          configId: config._id,
          createdAt: { $gte: new Date(now.getTime() - 60 * 60 * 1000) },
        }).exec();

        if (existing) continue;

        const targetUsers = config.targetRoles.includes('interviewer')
          ? [interview.interviewerId._id.toString()]
          : [];

        const admins = await this.userModel.find({ role: { $in: config.targetRoles } }).exec();
        targetUsers.push(...admins.map(u => u._id.toString()));

        const uniqueUsers = [...new Set(targetUsers)];

        for (const userId of uniqueUsers) {
          await this.createReminder(
            userId,
            config.type,
            `面试即将开始（${thresholdMinutes}分钟后）`,
            `${interview.candidateName} 的面试将在 ${thresholdMinutes} 分钟后开始，请做好准备。\n时间：${interview.interviewDate.toLocaleDateString()} ${interview.startTime}-${interview.endTime}`,
            {
              module: 'interviews',
              recordId: interview._id.toString(),
              relatedData: {
                candidateName: interview.candidateName,
                startTime: interview.startTime,
                endTime: interview.endTime,
              },
            },
            config._id.toString(),
          );
        }
      }
    }
  }

  @Cron('0 8 * * *')
  async sendDailyReminders() {
    const config = await this.reminderConfigModel.findOne({
      enabled: true,
      trigger: ReminderTrigger.DAILY_SCHEDULE,
    }).exec();

    if (!config) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const interviews = await this.interviewModel.find({
      interviewDate: { $gte: today, $lt: tomorrow },
      status: { $nin: [InterviewStatus.CANCELLED, InterviewStatus.NO_SHOW] },
    }).populate('interviewerId').exec();

    const groupedByInterviewer = interviews.reduce((acc, interview) => {
      const id = interview.interviewerId._id.toString();
      if (!acc[id]) acc[id] = [];
      acc[id].push(interview);
      return acc;
    }, {});

    for (const [interviewerId, interviewerInterviews] of Object.entries(groupedByInterviewer)) {
      const list = interviewerInterviews as any[];
      await this.createReminder(
        interviewerId,
        ReminderType.INFO,
        `今日面试日程（${list.length}场）`,
        `您今日共有 ${list.length} 场面试安排：\n${list.map(i => `${i.startTime}-${i.endTime} ${i.candidateName}（${i.position || '待安排'}）`).join('\n')}`,
        {
          module: 'interviews',
          relatedData: { count: list.length, date: today.toLocaleDateString() },
        },
        config._id.toString(),
      );
    }
  }

  @Cron('*/10 * * * *')
  async checkNoCheckin() {
    const config = await this.reminderConfigModel.findOne({
      enabled: true,
      trigger: ReminderTrigger.NO_CHECKIN,
    }).exec();

    if (!config) return;

    const graceMinutes = config.config.checkInGraceMinutes || 15;
    const now = new Date();
    const checkTime = new Date(now.getTime() - graceMinutes * 60 * 1000);

    const interviews = await this.interviewModel.find({
      interviewDate: { $lte: now },
      status: { $in: [InterviewStatus.SCHEDULED, InterviewStatus.CONFIRMED] },
    }).exec();

    for (const interview of interviews) {
      const [hours, minutes] = interview.startTime.split(':').map(Number);
      const interviewStart = new Date(interview.interviewDate);
      interviewStart.setHours(hours, minutes, 0, 0);

      if (interviewStart > checkTime) continue;

      const reminderKey = `checkin_${interview._id}`;
      const existing = await this.reminderModel.findOne({
        'metadata.recordId': interview._id.toString(),
        type: ReminderType.WARNING,
        createdAt: { $gte: new Date(now.getTime() - 30 * 60 * 1000) },
      }).exec();

      if (existing) continue;

      const admins = await this.userModel.find({ role: { $in: config.targetRoles } }).exec();

      for (const admin of admins) {
        await this.createReminder(
          admin._id.toString(),
          ReminderType.WARNING,
          '候选人未签到提醒',
          `${interview.candidateName} 的面试已超过 ${graceMinutes} 分钟仍未签到，请及时联系。`,
          {
            module: 'interviews',
            recordId: interview._id.toString(),
          },
          config._id.toString(),
        );
      }
    }
  }

  @Cron('0 9 * * 1')
  async checkInterviewerQuota() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const interviewers = await this.userModel.find({
      role: Role.INTERVIEWER,
      isActive: true,
    }).exec();

    const enabledConfigs = await this.reminderConfigModel.find({
      enabled: true,
      trigger: ReminderTrigger.INTERVIEWER_QUOTA,
    }).exec();

    if (enabledConfigs.length === 0) return;

    for (const interviewer of interviewers) {
      const totalSchedules = await this.scheduleModel.countDocuments({
        interviewerId: interviewer._id,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      }).exec();

      const bookedSchedules = await this.scheduleModel.countDocuments({
        interviewerId: interviewer._id,
        date: { $gte: startOfMonth, $lte: endOfMonth },
        status: ScheduleStatus.BOOKED,
      }).exec();

      const usedPercentage = totalSchedules > 0 
        ? Math.round((bookedSchedules / totalSchedules) * 100) 
        : 0;

      for (const config of enabledConfigs) {
        const threshold = config.config.quotaWarningPercentage || 80;
        if (usedPercentage < threshold) continue;

        const existing = await this.reminderModel.findOne({
          'metadata.relatedData.interviewerId': interviewer._id.toString(),
          configId: config._id,
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        }).exec();

        if (existing) continue;

        const admins = await this.userModel.find({
          role: { $in: config.targetRoles },
        }).exec();

        for (const admin of admins) {
          await this.createReminder(
            admin._id.toString(),
            config.type,
            config.type === ReminderType.BLOCKING
              ? `阻断告警：${interviewer.name}档期已满`
              : `提醒：${interviewer.name}档期使用${usedPercentage}%`,
            `面试官 ${interviewer.name}（${interviewer.department || '未分配部门'}）本月档期使用情况：\n- 总档期：${totalSchedules} 个\n- 已预约：${bookedSchedules} 个\n- 使用率：${usedPercentage}%\n\n${usedPercentage >= 100 ? '该面试官本月档期已全部占用，请立即安排新增档期！' : '请及时关注档期余量，提前补充可用时间。'}`,
            {
              module: 'schedules',
              relatedData: {
                interviewerId: interviewer._id.toString(),
                interviewerName: interviewer.name,
                totalSchedules,
                bookedSchedules,
                usedPercentage,
                month: `${now.getFullYear()}-${now.getMonth() + 1}`,
              },
            },
            config._id.toString(),
          );
        }
      }
    }
  }

  @Cron('0 */2 * * *')
  async checkNoAssessment() {
    const config = await this.reminderConfigModel.findOne({
      enabled: true,
      trigger: ReminderTrigger.NO_ASSESSMENT,
    }).exec();

    if (!config) return;

    const deadlineHours = config.config.assessmentDeadlineHours || 2;
    const now = new Date();
    const checkTime = new Date(now.getTime() - deadlineHours * 60 * 60 * 1000);

    const completedInterviews = await this.interviewModel.find({
      status: InterviewStatus.COMPLETED,
      endInterviewTime: { $lte: checkTime },
      hireResult: { $in: ['pending', null] },
    }).populate('interviewerId').exec();

    for (const interview of completedInterviews) {
      const existingAssessment = await this.assessmentModel.findOne({
        interviewId: interview._id,
      }).exec();

      if (existingAssessment) continue;

      const existing = await this.reminderModel.findOne({
        'metadata.recordId': interview._id.toString(),
        type: config.type,
        createdAt: { $gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) },
      }).exec();

      if (existing) continue;

      const targetUsers = new Set<string>();
      targetUsers.add(interview.interviewerId._id.toString());

      const admins = await this.userModel.find({
        role: { $in: config.targetRoles },
      }).exec();
      admins.forEach(a => targetUsers.add(a._id.toString()));

      for (const userId of targetUsers) {
        await this.createReminder(
          userId,
          config.type,
          `测评未完成提醒：${interview.candidateName}`,
          `${interview.candidateName} 的面试已于 ${new Date(interview.endInterviewTime).toLocaleString('zh-CN')} 结束，超过 ${deadlineHours} 小时仍未完成测评。\n请尽快完成测评并填写录用建议。`,
          {
            module: 'assessments',
            recordId: interview._id.toString(),
            relatedData: {
              candidateName: interview.candidateName,
              position: interview.position,
              endTime: interview.endInterviewTime,
            },
          },
          config._id.toString(),
        );
      }
    }
  }

  async runAllChecks() {
    try {
      await this.checkInterviewReminders();
    } catch (e) { console.error('checkInterviewReminders error:', e); }
    try {
      await this.checkNoCheckin();
    } catch (e) { console.error('checkNoCheckin error:', e); }
    try {
      await this.checkNoAssessment();
    } catch (e) { console.error('checkNoAssessment error:', e); }
    try {
      await this.checkInterviewerQuota();
    } catch (e) { console.error('checkInterviewerQuota error:', e); }
    return { message: '所有提醒检测已执行完成' };
  }

  async createTestReminders(userId: string) {
    await this.createReminder(
      userId,
      ReminderType.INFO,
      '【示例】普通提示：面试日程提醒',
      '这是一条普通提示消息，用于提醒您关注今日面试日程安排。\n普通提示仅作信息告知，不会阻断操作流程。',
      { module: 'test', relatedData: { type: 'info' } },
    );

    await this.createReminder(
      userId,
      ReminderType.WARNING,
      '【示例】警告：档期使用超80%',
      '警告：某面试官档期使用率已超过 80%，请及时补充可用时间段。',
      { module: 'test', relatedData: { type: 'warning' } },
    );

    await this.createReminder(
      userId,
      ReminderType.BLOCKING,
      '【示例】阻断告警：档期已满，请立即处理',
      '阻断告警：核心面试官本月档期已 100% 占用！\n此告警必须处理后才能进行关键操作，请立即为该面试官新增可用档期。',
      { module: 'test', relatedData: { type: 'blocking' } },
    );

    return { message: '测试提醒已创建，请查看' };
  }
}
