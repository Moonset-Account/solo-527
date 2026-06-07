import { Channel, Sample, ReviewQueueItem } from './mockData';

export interface DataStore {
  channels: Channel[];
  samples: Sample[];
  reviewQueue: ReviewQueueItem[];
}

const initialChannels: Channel[] = [
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

const generateSamplesForChannel = (channelId: string, channelName: string, count: number): Sample[] => {
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
      id: `sample-${channelId}-${(i + 1).toString().padStart(4, '0')}`,
      channelId,
      channelName,
      totalDuration: isFast ? Math.floor(Math.random() * 60) + 20 : Math.floor(Math.random() * 480) + 120,
      deviceId: `dev-${Math.floor(Math.random() * 200).toString().padStart(4, '0')}`,
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

const buildInitialReviewQueue = (samples: Sample[]): ReviewQueueItem[] => {
  return samples
    .filter(s => s.status === 'pending')
    .map((s, idx) => ({
      id: `rv-${(idx + 1).toString().padStart(3, '0')}`,
      sampleId: s.id,
      channelId: s.channelId,
      channelName: s.channelName,
      abnormalTypes: s.abnormalTypes,
      markedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19),
      status: 'pending' as const,
    }));
};

let store: DataStore;

function initializeStore(): DataStore {
  const allSamples: Sample[] = [];
  initialChannels.forEach(channel => {
    const samples = generateSamplesForChannel(channel.id, channel.name, 150);
    allSamples.push(...samples);
  });
  
  const reviewQueue = buildInitialReviewQueue(allSamples);
  
  const channelsWithCounts = initialChannels.map(channel => {
    const channelSamples = allSamples.filter(s => s.channelId === channel.id);
    const pendingSamples = channelSamples.filter(s => s.status === 'pending');
    const rejectedSamples = channelSamples.filter(s => s.status === 'rejected');
    
    return {
      ...channel,
      totalSamples: channelSamples.length,
      pendingReview: pendingSamples.length,
      fastAnswerCount: channelSamples.filter(s => s.abnormalTypes.includes('fast_answer')).length,
      duplicateSubmissionCount: channelSamples.filter(s => s.abnormalTypes.includes('duplicate_submission')).length,
      deviceConcentrationCount: channelSamples.filter(s => s.abnormalTypes.includes('device_concentration')).length,
      skipAbnormalCount: channelSamples.filter(s => s.abnormalTypes.includes('skip_abnormal')).length,
      openCopyCount: channelSamples.filter(s => s.abnormalTypes.includes('open_copy')).length,
    };
  });
  
  channelsWithCounts.forEach(channel => {
    channel.qualityScore = calculateQualityScore(channel, allSamples);
  });
  
  return {
    channels: channelsWithCounts,
    samples: allSamples,
    reviewQueue,
  };
}

function calculateQualityScore(channel: Channel, allSamples: Sample[]): number {
  const channelSamples = allSamples.filter(s => s.channelId === channel.id);
  const total = channelSamples.length;
  if (total === 0) return 100;
  
  const approved = channelSamples.filter(s => s.status === 'approved').length;
  const rejected = channelSamples.filter(s => s.status === 'rejected').length;
  const pending = channelSamples.filter(s => s.status === 'pending').length;
  
  const baseScore = 100;
  const rejectedPenalty = (rejected / total) * 40;
  const pendingPenalty = (pending / total) * 10;
  const abnormalPenalty = (
    channel.fastAnswerCount * 0.5 +
    channel.duplicateSubmissionCount * 1.5 +
    channel.deviceConcentrationCount * 1 +
    channel.skipAbnormalCount * 0.8 +
    channel.openCopyCount * 1.2
  ) / total * 30;
  
  const score = Math.round(baseScore - rejectedPenalty - pendingPenalty - abnormalPenalty);
  return Math.max(0, Math.min(100, score));
}

function getStore(): DataStore {
  if (!store) {
    store = initializeStore();
  }
  return store;
}

function saveStore() {
}

export function getChannels(): Channel[] {
  return getStore().channels;
}

export function getChannelById(id: string): Channel | undefined {
  return getStore().channels.find(c => c.id === id);
}

export function getSamplesByChannel(channelId: string): Sample[] {
  return getStore().samples.filter(s => s.channelId === channelId);
}

export function getSampleById(id: string): Sample | undefined {
  return getStore().samples.find(s => s.id === id);
}

export function getReviewQueue(status?: string, channelId?: string): ReviewQueueItem[] {
  let items = [...getStore().reviewQueue];
  if (status && status !== 'all') {
    items = items.filter(i => i.status === status);
  }
  if (channelId) {
    items = items.filter(i => i.channelId === channelId);
  }
  return items;
}

export function getPendingReviewCount(): number {
  return getStore().reviewQueue.filter(i => i.status === 'pending').length;
}

export function batchReview(
  ids: string[],
  action: 'approved' | 'rejected',
  reviewer: string = '调研经理'
): { processedCount: number; updatedChannelIds: string[] } {
  const store = getStore();
  const now = new Date().toISOString();
  const nowStr = now.replace('T', ' ').slice(0, 19);
  
  const processedIds: string[] = [];
  const affectedChannelIds = new Set<string>();
  
  store.reviewQueue = store.reviewQueue.map(item => {
    if (ids.includes(item.id) && item.status === 'pending') {
      processedIds.push(item.id);
      affectedChannelIds.add(item.channelId);
      return {
        ...item,
        status: action,
        reviewer,
        reviewedAt: nowStr,
      };
    }
    return item;
  });
  
  store.samples = store.samples.map(sample => {
    const relatedReview = store.reviewQueue.find(r => r.sampleId === sample.id);
    if (relatedReview && ids.includes(relatedReview.id)) {
      return {
        ...sample,
        status: action,
      };
    }
    return sample;
  });
  
  const updatedChannelIds: string[] = [];
  store.channels = store.channels.map(channel => {
    if (affectedChannelIds.has(channel.id)) {
      const channelSamples = store.samples.filter(s => s.channelId === channel.id);
      const pendingCount = channelSamples.filter(s => s.status === 'pending').length;
      
      const updated = {
        ...channel,
        pendingReview: pendingCount,
        fastAnswerCount: channelSamples.filter(s => s.abnormalTypes.includes('fast_answer') && s.status !== 'rejected').length,
        duplicateSubmissionCount: channelSamples.filter(s => s.abnormalTypes.includes('duplicate_submission') && s.status !== 'rejected').length,
        deviceConcentrationCount: channelSamples.filter(s => s.abnormalTypes.includes('device_concentration') && s.status !== 'rejected').length,
        skipAbnormalCount: channelSamples.filter(s => s.abnormalTypes.includes('skip_abnormal') && s.status !== 'rejected').length,
        openCopyCount: channelSamples.filter(s => s.abnormalTypes.includes('open_copy') && s.status !== 'rejected').length,
        updatedAt: nowStr,
      };
      
      updated.qualityScore = calculateQualityScore(updated, store.samples);
      updatedChannelIds.push(channel.id);
      return updated;
    }
    return channel;
  });
  
  saveStore();
  
  return {
    processedCount: processedIds.length,
    updatedChannelIds,
  };
}

export function getDurationBins(channelId?: string) {
  let samples = getStore().samples;
  if (channelId) {
    samples = samples.filter(s => s.channelId === channelId);
  }
  
  const durations = samples.map(s => s.totalDuration);
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
}

export function getDeviceAggregation(channelId?: string) {
  let samples = getStore().samples;
  if (channelId) {
    samples = samples.filter(s => s.channelId === channelId);
  }
  
  const deviceMap = new Map<string, number>();
  samples.forEach(s => {
    deviceMap.set(s.deviceId, (deviceMap.get(s.deviceId) || 0) + 1);
  });
  
  return Array.from(deviceMap.entries())
    .map(([deviceId, count]) => ({ deviceId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function getIpRegionAggregation(channelId?: string) {
  let samples = getStore().samples;
  if (channelId) {
    samples = samples.filter(s => s.channelId === channelId);
  }
  
  const regionMap = new Map<string, number>();
  samples.forEach(s => {
    regionMap.set(s.ipRegion, (regionMap.get(s.ipRegion) || 0) + 1);
  });
  
  return Array.from(regionMap.entries())
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAbnormalSamples(channelId?: string): Sample[] {
  let samples = getStore().samples;
  if (channelId) {
    samples = samples.filter(s => s.channelId === channelId);
  }
  return samples.filter(s => s.abnormalTypes.length > 0);
}
