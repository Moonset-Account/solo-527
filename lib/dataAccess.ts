import * as dbRepo from './dbRepository';

export async function getChannels() {
  return await dbRepo.getChannelsDB();
}

export async function getChannelById(id: string) {
  return await dbRepo.getChannelByIdDB(id);
}

export async function getSamplesByChannel(channelId: string) {
  return await dbRepo.getSamplesByChannelDB(channelId);
}

export async function getReviewQueue(status?: string, channelId?: string) {
  return await dbRepo.getReviewQueueDB(status, channelId);
}

export async function getPendingReviewCount() {
  return await dbRepo.getPendingReviewCountDB();
}

export async function getDurationBins(channelId?: string) {
  return await dbRepo.getDurationBinsDB(channelId);
}

export async function getDeviceAggregation(channelId?: string) {
  return await dbRepo.getDeviceAggregationDB(channelId);
}

export async function getIpRegionAggregation(channelId?: string) {
  return await dbRepo.getIpRegionAggregationDB(channelId);
}

export async function getAbnormalSamples(channelId?: string) {
  return await dbRepo.getAbnormalSamplesDB(channelId);
}

export async function batchReview(
  ids: string[],
  action: 'approved' | 'rejected',
  reviewer: string = '调研经理'
) {
  return await dbRepo.batchReviewDB(ids, action, reviewer);
}

export async function getSampleById(id: string) {
  return await dbRepo.getSampleByIdDB(id);
}

export async function reviewSingleSampleBySampleId(
  sampleId: string,
  action: 'approved' | 'rejected',
  reviewer: string = '调研经理'
) {
  return await dbRepo.reviewSingleSampleBySampleIdDB(sampleId, action, reviewer);
}
