export interface Channel {
  id: string;
  name: string;
  totalSamples: number;
  qualityScore: number;
  pendingReview: number;
  fastAnswerCount: number;
  duplicateSubmissionCount: number;
  deviceConcentrationCount: number;
  skipAbnormalCount: number;
  openCopyCount: number;
  updatedAt: string;
}

export interface Sample {
  id: string;
  channelId: string;
  channelName: string;
  totalDuration: number;
  deviceId: string;
  ipRegion: string;
  abnormalTypes: string[];
  status: 'pending' | 'approved' | 'rejected';
  questionGroupDurations: { groupName: string; duration: number }[];
  skipPattern: number[];
  openAnswers: { question: string; answer: string; similarity?: number }[];
  submittedAt: string;
}

export interface ReviewQueueItem {
  id: string;
  sampleId: string;
  channelId: string;
  channelName: string;
  abnormalTypes: string[];
  markedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer?: string;
  reviewedAt?: string;
}

export const mockChannels: Channel[] = [
  {
    id: 'ch-001',
    name: '微信朋友圈投放',
    totalSamples: 1256,
    qualityScore: 78,
    pendingReview: 23,
    fastAnswerCount: 45,
    duplicateSubmissionCount: 12,
    deviceConcentrationCount: 8,
    skipAbnormalCount: 18,
    openCopyCount: 6,
    updatedAt: '2024-06-07 14:30:00',
  },
  {
    id: 'ch-002',
    name: '抖音信息流',
    totalSamples: 2341,
    qualityScore: 65,
    pendingReview: 56,
    fastAnswerCount: 128,
    duplicateSubmissionCount: 34,
    deviceConcentrationCount: 22,
    skipAbnormalCount: 45,
    openCopyCount: 19,
    updatedAt: '2024-06-07 14:25:00',
  },
  {
    id: 'ch-003',
    name: '微博粉丝通',
    totalSamples: 876,
    qualityScore: 89,
    pendingReview: 8,
    fastAnswerCount: 15,
    duplicateSubmissionCount: 3,
    deviceConcentrationCount: 2,
    skipAbnormalCount: 7,
    openCopyCount: 2,
    updatedAt: '2024-06-07 14:20:00',
  },
  {
    id: 'ch-004',
    name: '小红书种草',
    totalSamples: 1589,
    qualityScore: 72,
    pendingReview: 34,
    fastAnswerCount: 67,
    duplicateSubmissionCount: 18,
    deviceConcentrationCount: 15,
    skipAbnormalCount: 28,
    openCopyCount: 12,
    updatedAt: '2024-06-07 14:15:00',
  },
  {
    id: 'ch-005',
    name: '百度SEM',
    totalSamples: 654,
    qualityScore: 91,
    pendingReview: 5,
    fastAnswerCount: 8,
    duplicateSubmissionCount: 2,
    deviceConcentrationCount: 1,
    skipAbnormalCount: 3,
    openCopyCount: 1,
    updatedAt: '2024-06-07 14:10:00',
  },
  {
    id: 'ch-006',
    name: '知乎信息流',
    totalSamples: 1123,
    qualityScore: 82,
    pendingReview: 15,
    fastAnswerCount: 28,
    duplicateSubmissionCount: 7,
    deviceConcentrationCount: 5,
    skipAbnormalCount: 12,
    openCopyCount: 4,
    updatedAt: '2024-06-07 14:05:00',
  },
];

const generateQuestionGroupDurations = () => [
  { groupName: '基本信息', duration: Math.floor(Math.random() * 60) + 20 },
  { groupName: '消费习惯', duration: Math.floor(Math.random() * 120) + 60 },
  { groupName: '品牌认知', duration: Math.floor(Math.random() * 100) + 40 },
  { groupName: '购买意向', duration: Math.floor(Math.random() * 80) + 30 },
  { groupName: '开放题', duration: Math.floor(Math.random() * 180) + 60 },
];

const generateOpenAnswers = (hasCopy: boolean) => {
  const baseAnswers = [
    { question: '您对该产品的主要建议是什么？', answer: '希望能有更多颜色选择，价格可以更优惠一些。' },
    { question: '您通常在什么场景下使用这类产品？', answer: '主要是上下班通勤和周末外出的时候使用。' },
  ];
  if (hasCopy) {
    return [
      { question: '您对该产品的主要建议是什么？', answer: '希望能有更多颜色选择，价格可以更优惠一些。', similarity: 0.95 },
      { question: '您通常在什么场景下使用这类产品？', answer: '希望能有更多颜色选择，价格可以更优惠一些。', similarity: 0.92 },
    ];
  }
  return baseAnswers.map(a => ({ ...a, similarity: Math.random() * 0.3 }));
};

export const generateMockSamples = (channelId: string, count: number = 50): Sample[] => {
  const channel = mockChannels.find(c => c.id === channelId);
  const samples: Sample[] = [];
  
  for (let i = 0; i < count; i++) {
    const abnormalTypes: string[] = [];
    const isFast = Math.random() < 0.15;
    const isDuplicate = Math.random() < 0.08;
    const isDeviceConcentrated = Math.random() < 0.06;
    const isSkipAbnormal = Math.random() < 0.1;
    const hasOpenCopy = Math.random() < 0.05;
    
    if (isFast) abnormalTypes.push('fast_answer');
    if (isDuplicate) abnormalTypes.push('duplicate_submission');
    if (isDeviceConcentrated) abnormalTypes.push('device_concentration');
    if (isSkipAbnormal) abnormalTypes.push('skip_abnormal');
    if (hasOpenCopy) abnormalTypes.push('open_copy');
    
    const status = abnormalTypes.length > 0 
      ? (Math.random() < 0.6 ? 'pending' : (Math.random() < 0.5 ? 'approved' : 'rejected'))
      : 'approved';
    
    samples.push({
      id: `sample-${channelId}-${i + 1}`,
      channelId,
      channelName: channel?.name || '未知渠道',
      totalDuration: isFast ? Math.floor(Math.random() * 60) + 20 : Math.floor(Math.random() * 480) + 120,
      deviceId: `dev-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`,
      ipRegion: ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市', '武汉市'][Math.floor(Math.random() * 7)],
      abnormalTypes,
      status,
      questionGroupDurations: generateQuestionGroupDurations(),
      skipPattern: isSkipAbnormal 
        ? Array.from({ length: 20 }, (_, idx) => Math.random() < 0.4 ? idx + 1 : -1).filter(x => x > 0)
        : [],
      openAnswers: generateOpenAnswers(hasOpenCopy),
      submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  return samples;
};

export const mockReviewQueue: ReviewQueueItem[] = [
  {
    id: 'rv-001',
    sampleId: 'sample-ch-002-1',
    channelId: 'ch-002',
    channelName: '抖音信息流',
    abnormalTypes: ['fast_answer', 'duplicate_submission'],
    markedAt: '2024-06-07 10:30:00',
    status: 'pending',
  },
  {
    id: 'rv-002',
    sampleId: 'sample-ch-002-5',
    channelId: 'ch-002',
    channelName: '抖音信息流',
    abnormalTypes: ['device_concentration', 'skip_abnormal'],
    markedAt: '2024-06-07 10:25:00',
    status: 'pending',
  },
  {
    id: 'rv-003',
    sampleId: 'sample-ch-004-3',
    channelId: 'ch-004',
    channelName: '小红书种草',
    abnormalTypes: ['open_copy'],
    markedAt: '2024-06-07 10:20:00',
    status: 'pending',
  },
  {
    id: 'rv-004',
    sampleId: 'sample-ch-001-2',
    channelId: 'ch-001',
    channelName: '微信朋友圈投放',
    abnormalTypes: ['fast_answer'],
    markedAt: '2024-06-07 10:15:00',
    status: 'pending',
  },
  {
    id: 'rv-005',
    sampleId: 'sample-ch-006-8',
    channelId: 'ch-006',
    channelName: '知乎信息流',
    abnormalTypes: ['skip_abnormal', 'open_copy'],
    markedAt: '2024-06-07 10:10:00',
    status: 'pending',
  },
];

export const getDurationBins = (durations: number[]) => {
  const bins = [
    { label: '0-60秒', min: 0, max: 60, count: 0 },
    { label: '61-120秒', min: 61, max: 120, count: 0 },
    { label: '121-180秒', min: 121, max: 180, count: 0 },
    { label: '181-300秒', min: 181, max: 300, count: 0 },
    { label: '301-600秒', min: 301, max: 600, count: 0 },
    { label: '600秒以上', min: 601, max: Infinity, count: 0 },
  ];
  
  durations.forEach(d => {
    const bin = bins.find(b => d >= b.min && d <= b.max);
    if (bin) bin.count++;
  });
  
  return bins;
};

export const getDeviceAggregation = (samples: Sample[]) => {
  const deviceMap = new Map<string, number>();
  samples.forEach(s => {
    deviceMap.set(s.deviceId, (deviceMap.get(s.deviceId) || 0) + 1);
  });
  return Array.from(deviceMap.entries())
    .map(([deviceId, count]) => ({ deviceId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

export const getIpRegionAggregation = (samples: Sample[]) => {
  const regionMap = new Map<string, number>();
  samples.forEach(s => {
    regionMap.set(s.ipRegion, (regionMap.get(s.ipRegion) || 0) + 1);
  });
  return Array.from(regionMap.entries())
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);
};
