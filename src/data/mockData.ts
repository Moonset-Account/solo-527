import {
  Candidate,
  Department,
  Position,
  Recruiter,
  Interviewer,
  Channel,
  StageType,
  CandidateStatus,
  ResultType,
  DataDictionaryItem,
} from './types';

const STAGE_NAMES: Record<StageType, string> = {
  resume: '简历筛选',
  screen: '初筛沟通',
  interview_1: '一面',
  interview_2: '二面',
  interview_3: '终面',
  offer: 'Offer发放',
  onboard: '入职',
};

const STAGES: StageType[] = ['resume', 'screen', 'interview_1', 'interview_2', 'interview_3', 'offer', 'onboard'];

export const departments: Department[] = [
  { id: 'dept_1', name: '技术研发部' },
  { id: 'dept_2', name: '产品部' },
  { id: 'dept_3', name: '市场部' },
  { id: 'dept_4', name: '运营部' },
  { id: 'dept_5', name: '人力资源部' },
  { id: 'dept_6', name: '财务部' },
];

export const recruiters: Recruiter[] = [
  { id: 'rec_1', name: '张明', departmentId: 'dept_5', departmentName: '人力资源部' },
  { id: 'rec_2', name: '李华', departmentId: 'dept_5', departmentName: '人力资源部' },
  { id: 'rec_3', name: '王芳', departmentId: 'dept_5', departmentName: '人力资源部' },
  { id: 'rec_4', name: '刘强', departmentId: 'dept_5', departmentName: '人力资源部' },
];

export const interviewers: Interviewer[] = [
  { id: 'int_1', name: '陈技术', department: '技术研发部', interviewCount: 0, totalHours: 0 },
  { id: 'int_2', name: '赵架构', department: '技术研发部', interviewCount: 0, totalHours: 0 },
  { id: 'int_3', name: '孙产品', department: '产品部', interviewCount: 0, totalHours: 0 },
  { id: 'int_4', name: '周运营', department: '运营部', interviewCount: 0, totalHours: 0 },
  { id: 'int_5', name: '吴市场', department: '市场部', interviewCount: 0, totalHours: 0 },
  { id: 'int_6', name: '郑研发', department: '技术研发部', interviewCount: 0, totalHours: 0 },
  { id: 'int_7', name: '钱总监', department: '技术研发部', interviewCount: 0, totalHours: 0 },
  { id: 'int_8', name: '冯HRD', department: '人力资源部', interviewCount: 0, totalHours: 0 },
];

export const channels: Channel[] = [
  { id: 'ch_1', name: 'BOSS直聘', type: 'paid', costPerCandidate: 150 },
  { id: 'ch_2', name: '猎聘', type: 'paid', costPerCandidate: 200 },
  { id: 'ch_3', name: '智联招聘', type: 'paid', costPerCandidate: 120 },
  { id: 'ch_4', name: '前程无忧', type: 'paid', costPerCandidate: 100 },
  { id: 'ch_5', name: '内推', type: 'referral', costPerCandidate: 50 },
  { id: 'ch_6', name: 'LinkedIn', type: 'paid', costPerCandidate: 250 },
  { id: 'ch_7', name: '校园招聘', type: 'campus', costPerCandidate: 80 },
  { id: 'ch_8', name: '官网投递', type: 'free', costPerCandidate: 0 },
];

const positionNames = [
  { dept: 'dept_1', names: ['前端工程师', '后端工程师', '全栈工程师', '算法工程师', '测试工程师', '运维工程师', '数据工程师'] },
  { dept: 'dept_2', names: ['产品经理', '产品助理', 'UX设计师', 'UI设计师'] },
  { dept: 'dept_3', names: ['市场专员', '品牌经理', '新媒体运营', '市场分析师'] },
  { dept: 'dept_4', names: ['运营专员', '用户运营', '活动运营', '数据运营'] },
  { dept: 'dept_5', names: ['HRBP', '招聘专员', '培训专员', '薪酬绩效'] },
  { dept: 'dept_6', names: ['会计', '财务分析师', '出纳'] },
];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗'];
const lastNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平'];

function generateName(): string {
  return randomChoice(firstNames) + randomChoice(lastNames);
}

export const positions: Position[] = positionNames.flatMap(({ dept, names }) =>
  names.map((name, idx) => {
    const deptInfo = departments.find(d => d.id === dept)!;
    const recruiter = randomChoice(recruiters);
    return {
      id: `pos_${dept}_${idx}`,
      name,
      departmentId: dept,
      departmentName: deptInfo.name,
      recruiterId: recruiter.id,
      recruiterName: recruiter.name,
      publishDate: randomDate(new Date('2025-01-01'), new Date('2026-05-01')),
      status: randomChoice(['open', 'open', 'open', 'closed', 'paused']) as 'open' | 'closed' | 'paused',
      headCount: randomInt(1, 5),
    };
  })
);

function generateCandidate(id: number): Candidate {
  const position = randomChoice(positions);
  const channel = randomChoice(channels);
  const recruiter = recruiters.find(r => r.id === position.recruiterId) || randomChoice(recruiters);
  const dept = departments.find(d => d.id === position.departmentId)!;

  const applyDate = randomDate(new Date('2026-01-01'), new Date('2026-06-01'));

  const statusWeights: CandidateStatus[] = [
    'rejected', 'rejected', 'rejected',
    'in_progress', 'in_progress',
    'hired', 'hired',
    'offer_declined'
  ];
  const status = randomChoice(statusWeights);

  let maxStageIndex: number;
  if (status === 'hired') {
    maxStageIndex = 6;
  } else if (status === 'offer_declined') {
    maxStageIndex = 5;
  } else if (status === 'rejected') {
    maxStageIndex = randomInt(0, 4);
  } else {
    maxStageIndex = randomInt(0, 5);
  }

  const stages = [];
  let currentDate = new Date(applyDate);
  let totalDays = 0;
  let interviewerCounts: Record<string, { count: number; hours: number }> = {};

  for (let i = 0; i <= maxStageIndex; i++) {
    const stage = STAGES[i];
    const isLastStage = i === maxStageIndex;

    let durationDays: number;
    if (stage === 'resume') durationDays = randomInt(1, 3);
    else if (stage === 'screen') durationDays = randomInt(2, 5);
    else if (stage.startsWith('interview')) durationDays = randomInt(3, 10);
    else if (stage === 'offer') durationDays = randomInt(3, 7);
    else durationDays = randomInt(7, 14);

    if (isLastStage && status === 'in_progress') {
      durationDays = Math.ceil((new Date().getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const startDate = new Date(currentDate);
    const endDate = isLastStage && status === 'in_progress' ? undefined : new Date(currentDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    let result: ResultType | undefined;
    if (!isLastStage || status === 'hired') {
      result = 'pass';
    } else if (status === 'rejected') {
      result = 'fail';
    } else if (status === 'offer_declined') {
      result = 'fail';
    }

    let interviewerId: string | undefined;
    let interviewerName: string | undefined;
    if (stage.startsWith('interview')) {
      const interviewer = randomChoice(interviewers.filter(i => i.department === dept.name || i.department === '人力资源部'));
      interviewerId = interviewer.id;
      interviewerName = interviewer.name;
      if (!interviewerCounts[interviewer.id]) {
        interviewerCounts[interviewer.id] = { count: 0, hours: 0 };
      }
      interviewerCounts[interviewer.id].count++;
      interviewerCounts[interviewer.id].hours += randomInt(1, 2);
    }

    const isAnomaly = durationDays > (stage.startsWith('interview') ? 14 : 10) && Math.random() > 0.7;
    const anomalyReason = isAnomaly ? '阶段耗时超过标准值' : undefined;

    stages.push({
      id: `stage_${id}_${i}`,
      candidateId: `cand_${id}`,
      stage,
      stageName: STAGE_NAMES[stage],
      startDate,
      endDate,
      interviewerId,
      interviewerName,
      result,
      durationDays,
      notes: Math.random() > 0.8 ? '候选人表现优秀，建议推进' : undefined,
      isAnomaly,
      anomalyReason,
    });

    totalDays += durationDays;
    if (endDate) {
      currentDate = new Date(endDate.getTime() + randomInt(1, 3) * 24 * 60 * 60 * 1000);
    }
  }

  Object.entries(interviewerCounts).forEach(([intId, data]) => {
    const intv = interviewers.find(i => i.id === intId);
    if (intv) {
      intv.interviewCount += data.count;
      intv.totalHours += data.hours;
    }
  });

  const currentStage = STAGES[maxStageIndex];
  const feedbackKeywords = ['面试官专业', '流程顺畅', '等待时间长', '环境好', '沟通清晰', '反馈及时', '体验佳', '效率高'];

  return {
    id: `cand_${id}`,
    name: generateName(),
    positionId: position.id,
    positionName: position.name,
    departmentId: dept.id,
    departmentName: dept.name,
    channelId: channel.id,
    channelName: channel.name,
    recruiterId: recruiter.id,
    recruiterName: recruiter.name,
    applyDate,
    currentStage,
    currentStageName: STAGE_NAMES[currentStage],
    status,
    stages,
    totalCycleDays: totalDays,
    feedback: status !== 'in_progress' && Math.random() > 0.4 ? {
      id: `fb_${id}`,
      candidateId: `cand_${id}`,
      stage: currentStage,
      satisfaction: randomInt(2, 5),
      comments: randomChoice(['整体体验不错', '流程有待优化', '面试官很专业', '等待时间有点长']),
      submitDate: randomDate(applyDate, new Date()),
      keywords: Array.from({ length: randomInt(2, 4) }, () => randomChoice(feedbackKeywords)),
    } : undefined,
  };
}

export const candidates: Candidate[] = Array.from({ length: 258 }, (_, i) => generateCandidate(i));

export const dataDictionary: DataDictionaryItem[] = [
  { fieldName: 'positionCount', displayName: '职位发布数', description: '统计周期内发布的职位数量', type: 'number', unit: '个' },
  { fieldName: 'resumeCount', displayName: '简历数', description: '统计周期内收到的简历数量', type: 'number', unit: '份' },
  { fieldName: 'interviewCount', displayName: '面试数', description: '统计周期内安排的面试数量', type: 'number', unit: '次' },
  { fieldName: 'offerCount', displayName: 'Offer数', description: '统计周期内发放的Offer数量', type: 'number', unit: '个' },
  { fieldName: 'onboardCount', displayName: '入职数', description: '统计周期内实际入职的人数', type: 'number', unit: '人' },
  { fieldName: 'avgCycleDays', displayName: '平均招聘周期', description: '从简历收到到入职的平均天数', type: 'number', unit: '天' },
  { fieldName: 'conversionRate', displayName: '简历入职转化率', description: '入职人数/简历总数', type: 'percentage', unit: '%' },
  { fieldName: 'offerAcceptRate', displayName: 'Offer接受率', description: '接受Offer人数/发放Offer总数', type: 'percentage', unit: '%' },
  {
    fieldName: 'status',
    displayName: '候选人状态',
    description: '候选人当前的招聘状态',
    type: 'enum',
    enumValues: [
      { value: 'in_progress', label: '进行中' },
      { value: 'hired', label: '已入职' },
      { value: 'rejected', label: '已拒绝' },
      { value: 'offer_declined', label: 'Offer拒绝' },
    ],
  },
  {
    fieldName: 'stage',
    displayName: '招聘阶段',
    description: '招聘流程的各个阶段',
    type: 'enum',
    enumValues: [
      { value: 'resume', label: '简历筛选' },
      { value: 'screen', label: '初筛沟通' },
      { value: 'interview_1', label: '一面' },
      { value: 'interview_2', label: '二面' },
      { value: 'interview_3', label: '终面' },
      { value: 'offer', label: 'Offer发放' },
      { value: 'onboard', label: '入职' },
    ],
  },
];

export const STAGE_ORDER: StageType[] = ['resume', 'screen', 'interview_1', 'interview_2', 'interview_3', 'offer', 'onboard'];

export { STAGE_NAMES };
