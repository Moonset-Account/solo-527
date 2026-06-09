import { Router, type Request, type Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import MeetingService from '../services/MeetingService.js';
import ActionItemService from '../services/ActionItemService.js';
import { db, uuidv4 } from '../db/database.js';
import type { TranscriptSegment, Speaker, ActionItem } from '#shared/types';

const router = Router();

const SAMPLE_MEETINGS = [
  {
    title: '产品需求评审会议 - 用户体系重构',
    date: '2025-03-10',
    projectId: 'proj_alpha',
    topics: ['用户体系重构', '登录流程优化', '权限模型设计'],
    speakers: [
      { id: 'spk_1', name: '李明', role: '项目经理', color: '#3b82f6' },
      { id: 'spk_2', name: '张三', role: '前端工程师', color: '#10b981' },
      { id: 'spk_3', name: '陈静', role: '产品经理', color: '#f59e0b' },
      { id: 'spk_4', name: '赵六', role: '后端工程师', color: '#8b5cf6' },
    ] as Speaker[],
    transcript: [
      {
        speakerId: 'spk_1',
        startTime: '00:00:15',
        endTime: '00:00:48',
        text: '各位同事早上好，今天我们来评审用户体系重构的需求，邮箱联系用 admin@demo.com，先请产品经理陈静介绍整体背景。',
      },
      {
        speakerId: 'spk_3',
        startTime: '00:00:52',
        endTime: '00:02:20',
        text: '好的，这次用户体系重构主要是为了 Q2 产品迭代上线做准备，核心目标有三点：第一、支持多租户 RBAC 权限模型；第二、手机号 13800138000 统一登录；第三、和财务系统对接时要注意脱敏银行账号 6222021234567890。',
      },
      {
        speakerId: 'spk_4',
        startTime: '00:02:25',
        endTime: '00:03:40',
        text: '后端这边我负责对接，我建议本周先完成数据库迁移脚本和 API 接口定义，下周三 2025-03-19 之前完成第一版联调。权限模型参考现有 ACL 文档，有疑问可以找我确认。',
      },
      {
        speakerId: 'spk_2',
        startTime: '00:03:45',
        endTime: '00:04:50',
        text: '前端登录页面我来负责，需要和设计确认新的 UI 稿。另外建议把注册流程和登录流程合并，减少页面跳转。负责人就由我跟进吧。',
      },
      {
        speakerId: 'spk_3',
        startTime: '00:04:55',
        endTime: '00:05:40',
        text: '补充两点：第一、薪资信息和机密数据在前后端传输要做脱敏；第二、紧急事项——第三方登录接口现在经常超时，必须今天修复，P0 优先级，不然线上会出问题。',
      },
      {
        speakerId: 'spk_1',
        startTime: '00:05:45',
        endTime: '00:06:30',
        text: '好，我最后做下总结：本次需求评审形成以下行动项。赵六负责后端接口本周完成；张三负责前端页面改造近期完成；陈静周三前提供设计稿；第三方登录问题今天解决，张老师跟进。另外整体进度纳入 Q2 产品迭代上线里程碑。散会。',
      },
    ],
  },
  {
    title: 'AI 模型优化专项讨论会',
    date: '2025-03-12',
    projectId: 'proj_alpha',
    topics: ['AI 模型优化', 'Prompt 调优', '评估指标', '微调方案'],
    speakers: [
      { id: 'spk_1', name: '李明', role: '项目经理', color: '#3b82f6' },
      { id: 'spk_5', name: '王五', role: '算法工程师', color: '#ef4444' },
      { id: 'spk_3', name: '陈静', role: '审核员', color: '#f59e0b' },
    ] as Speaker[],
    transcript: [
      {
        speakerId: 'spk_1',
        startTime: '00:00:10',
        endTime: '00:00:50',
        text: '今天开这个会讨论 AI 行动项抽取模型的优化，目标是把抽取准确率在 Q3 质量提升里程碑中提升到 90% 以上。先请审核员陈静介绍一下最近人工标注中发现的问题。',
      },
      {
        speakerId: 'spk_3',
        startTime: '00:00:55',
        endTime: '00:02:30',
        text: '好的，我们本周人工审核了 80 条样本，主要发现几个问题：第一、负责人字段经常凭空猜测，置信度低但还是填了；第二、截止日期经常对不上，比如会议说下周五，但模型换算成日期会出错；第三、优先级判断不准，P0 和 P1 混淆较多；第四、证据链有缺失，有些字段找不到原文引用。建议在 Prompt 里再次强调负责人不确定必须为 null。',
      },
      {
        speakerId: 'spk_5',
        startTime: '00:02:35',
        endTime: '00:04:10',
        text: '算法这边方案是这样：第一、本周我负责重新调整 System Prompt，加入更严格的规则约束；第二、下周我完成 2025-03-21 前启动一次 gpt-4o-mini 微调，用已确认的 150 条高质量样本训练；第三、陈静同学这边在这周内再标注 50 条高质量样本，用于验证集；第四、微调后做 A/B 对比，评估 precision/recall/f1。',
      },
      {
        speakerId: 'spk_1',
        startTime: '00:04:15',
        endTime: '00:05:00',
        text: '好的，按这个方案执行。另外提醒一下，样本数据中涉及用户邮箱 zhangsan@demo.com、身份证号 110101199001011234 等敏感信息，在导出训练集时记得执行脱敏规则，避免信息泄露。有问题随时找我。',
      },
    ],
  },
  {
    title: 'Q2 项目进度周会',
    date: '2025-03-14',
    projectId: 'proj_alpha',
    topics: ['项目进度', '风险追踪', '资源协调'],
    speakers: [
      { id: 'spk_1', name: '李明', role: '项目经理', color: '#3b82f6' },
      { id: 'spk_2', name: '张三', role: '前端工程师', color: '#10b981' },
      { id: 'spk_4', name: '赵六', role: '后端工程师', color: '#8b5cf6' },
      { id: 'spk_6', name: '孙七', role: 'QA 工程师', color: '#06b6d4' },
    ] as Speaker[],
    transcript: [
      {
        speakerId: 'spk_1',
        startTime: '00:00:10',
        endTime: '00:00:45',
        text: '周会开始，先轮流汇报下本周进度。手机号 13912345678 有问题找我。赵六先讲后端。',
      },
      {
        speakerId: 'spk_4',
        startTime: '00:00:48',
        endTime: '00:01:50',
        text: '后端这边，用户系统 API 完成度 70%，数据库迁移脚本已经提交，接口文档在编写中。遇到一个阻塞问题：用户表唯一索引在分库场景下的冲突问题，需要 DBA 协助，这个属于 P1 优先级，希望明天能安排资源解决。预计 2025-03-20 完成全部后端开发。',
      },
      {
        speakerId: 'spk_2',
        startTime: '00:01:55',
        endTime: '00:02:50',
        text: '前端这边，登录/注册页面完成 80%，UI 组件复用已完成。但是设计稿中部分交互细节还没确认，需要产品经理周三前回复。我这边负责在 2025-03-18 之前完成页面联调。另外建议补充加载态的动画效果。',
      },
      {
        speakerId: 'spk_6',
        startTime: '00:02:55',
        endTime: '00:03:55',
        text: 'QA 这边测试用例编写了 60%，本周开始第一轮接口测试。发现一个问题：密码加密用 bcryptjs 的 salt 轮数在高并发下性能较差，建议做性能测试。另外负责人分配问题我这边来跟进，下周一开始第一轮冒烟测试。',
      },
      {
        speakerId: 'spk_1',
        startTime: '00:04:00',
        endTime: '00:04:50',
        text: '好的，汇总一下行动项：赵六明天和 DBA 确认分库索引方案；张三周三前催设计稿；孙七下周一开始冒烟测试；我这边联系 DBA 资源协调。另外整体来看 Q2 产品迭代上线里程碑目前 at_risk 状态，要注意截止日期 2025-06-30。本周会议纪要请大家确认一下。',
      },
    ],
  },
];

const createHumanConfirmedActionItems = (): Array<{
  meetingIndex: number;
  patch: Partial<ActionItem>;
  status: ActionItem['status'];
}[]> => [
  [
    {
      meetingIndex: 0,
      patch: {
        content: '赵六负责完成用户体系重构后端数据库迁移脚本与 API 接口定义，2025-03-19 前完成第一版联调',
        assignee: '赵六',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-19',
        topic: '用户体系重构',
        milestoneId: 'ms_001',
        priority: 'P1',
      },
      status: 'assigned',
    },
    {
      meetingIndex: 0,
      patch: {
        content: '张三负责前端登录页面改造，与设计确认 UI 稿，合并注册与登录流程',
        assignee: '张三',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-20',
        topic: '用户体系重构',
        milestoneId: 'ms_001',
        priority: 'P1',
      },
      status: 'assigned',
    },
    {
      meetingIndex: 0,
      patch: {
        content: '陈静在 2025-03-19 周三前提供用户体系重构设计稿',
        assignee: '陈静',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-19',
        topic: '用户体系重构',
        milestoneId: 'ms_001',
        priority: 'P2',
      },
      status: 'assigned',
    },
    {
      meetingIndex: 0,
      patch: {
        content: '修复第三方登录接口超时问题，P0 优先级，今日必须解决',
        assignee: '赵六',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-10',
        topic: '线上问题修复',
        milestoneId: 'ms_001',
        priority: 'P0',
      },
      status: 'in_progress',
    },
    {
      meetingIndex: 0,
      patch: {
        content: '确保薪资、机密等敏感数据在前后端传输中执行脱敏规则',
        assignee: null,
        assigneeStatus: 'pending_assignment',
        dueDate: null,
        topic: '数据安全',
        milestoneId: null,
        priority: 'P2',
      },
      status: 'pending',
    },
  ],
  [
    {
      meetingIndex: 1,
      patch: {
        content: '王五本周重新调整 System Prompt，加入更严格的规则约束（负责人不确定必须为 null）',
        assignee: '王五',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-16',
        topic: 'AI 模型优化',
        milestoneId: 'ms_002',
        priority: 'P1',
      },
      status: 'assigned',
    },
    {
      meetingIndex: 1,
      patch: {
        content: '王五在 2025-03-21 前启动 gpt-4o-mini 模型微调，基于 150 条高质量样本训练',
        assignee: '王五',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-21',
        topic: '模型微调',
        milestoneId: 'ms_002',
        priority: 'P1',
      },
      status: 'assigned',
    },
    {
      meetingIndex: 1,
      patch: {
        content: '陈静本周内再标注 50 条高质量评估样本，用于验证集',
        assignee: '陈静',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-16',
        topic: '数据标注',
        milestoneId: 'ms_002',
        priority: 'P2',
      },
      status: 'assigned',
    },
    {
      meetingIndex: 1,
      patch: {
        content: '模型微调后执行 A/B 对比评估，统计 precision/recall/f1 指标',
        assignee: '王五',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-25',
        topic: '模型评估',
        milestoneId: 'ms_002',
        priority: 'P2',
      },
      status: 'confirmed',
    },
    {
      meetingIndex: 1,
      patch: {
        content: '训练集导出前确认所有敏感字段（邮箱、身份证号等）均已执行脱敏处理',
        assignee: '陈静',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-20',
        topic: '数据安全',
        milestoneId: null,
        priority: 'P2',
      },
      status: 'confirmed',
    },
  ],
  [
    {
      meetingIndex: 2,
      patch: {
        content: '赵六明天与 DBA 确认分库场景下用户表唯一索引冲突方案',
        assignee: '赵六',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-15',
        topic: '后端开发',
        milestoneId: 'ms_001',
        priority: 'P1',
      },
      status: 'in_progress',
    },
    {
      meetingIndex: 2,
      patch: {
        content: '张三周三前催产品经理确认设计稿中交互细节',
        assignee: '张三',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-19',
        topic: '前端开发',
        milestoneId: 'ms_001',
        priority: 'P2',
      },
      status: 'assigned',
    },
    {
      meetingIndex: 2,
      patch: {
        content: '孙七下周一 2025-03-17 开始执行第一轮冒烟测试',
        assignee: '孙七',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-17',
        topic: '质量测试',
        milestoneId: 'ms_001',
        priority: 'P1',
      },
      status: 'assigned',
    },
    {
      meetingIndex: 2,
      patch: {
        content: '李明联系 DBA 协调分库索引方案相关资源',
        assignee: '李明',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-15',
        topic: '资源协调',
        milestoneId: 'ms_001',
        priority: 'P1',
      },
      status: 'confirmed',
    },
    {
      meetingIndex: 2,
      patch: {
        content: '针对 bcryptjs salt 轮数高并发性能问题做性能测试',
        assignee: '孙七',
        assigneeStatus: 'confirmed',
        dueDate: '2025-03-22',
        topic: '性能优化',
        milestoneId: null,
        priority: 'P3',
      },
      status: 'pending',
    },
  ],
];

router.post('/seed', authenticateToken, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const operator = {
      id: req.user!.userId,
      email: req.user!.email,
      name: req.user!.name,
      role: req.user!.role,
    };

    const createdMeetings: ReturnType<typeof MeetingService.list> = [];
    const meetingIds: string[] = [];

    const humanConfirmedPatches = createHumanConfirmedActionItems();

    const tx = db.transaction(() => {
      for (let i = 0; i < SAMPLE_MEETINGS.length; i++) {
        const raw = SAMPLE_MEETINGS[i];
        const meeting = MeetingService.create({
          title: raw.title,
          date: raw.date,
          projectId: raw.projectId,
          speakers: raw.speakers,
          topics: raw.topics,
          transcript: raw.transcript.map((s, idx) => ({
            ...s,
            id: `seed_seg_${i}_${idx}`,
            charOffset: 0,
          })) as TranscriptSegment[],
          createdBy: operator.id,
        });
        meetingIds.push(meeting.id);
        createdMeetings.push(meeting as unknown as ReturnType<typeof MeetingService.list>[number]);
      }
    });

    tx();

    for (let i = 0; i < meetingIds.length; i++) {
      const meetingId = meetingIds[i];
      try {
        await MeetingService.triggerExtraction(meetingId, operator.id);
      } catch {
        // 忽略单个失败，继续
      }
    }

    let patchedCount = 0;
    for (let i = 0; i < humanConfirmedPatches.length; i++) {
      const patches = humanConfirmedPatches[i];
      const items = MeetingService.getActionItems(meetingIds[i]);
      for (let j = 0; j < patches.length && j < items.length; j++) {
        const item = items[j];
        const patch = patches[j];
        try {
          ActionItemService.patch(item.id, patch.patch, operator, '演示样本人工确认');
          if (patch.status !== item.status) {
            ActionItemService.patch(item.id, { status: patch.status }, operator, '演示样本状态设置');
          }
          patchedCount++;
        } catch {
          // ignore
        }
      }
    }

    db.prepare("UPDATE milestones SET status = 'in_progress' WHERE id = 'ms_001'").run();

    res.json({
      success: true,
      data: {
        meetings: SAMPLE_MEETINGS.length,
        meetingIds,
        actionItemsPatched: patchedCount,
      },
    });
  } catch (err) {
    res.locals.errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : '注入演示样本失败',
    });
  }
});

export default router;
