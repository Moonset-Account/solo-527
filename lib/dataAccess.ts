import * as memoryStore from './dataStore';
import * as dbRepo from './dbRepository';

const USE_POSTGRES = process.env.USE_POSTGRES === 'true' || process.env.DATABASE_URL !== undefined;

export async function getChannels() {
  if (USE_POSTGRES) {
    try {
      return await dbRepo.getChannelsDB();
    } catch (error) {
      console.warn('PostgreSQL 不可用，回退到内存存储:', error);
      return memoryStore.getChannels();
    }
  }
  return memoryStore.getChannels();
}

export async function getChannelById(id: string) {
  if (USE_POSTGRES) {
    try {
      return await dbRepo.getChannelByIdDB(id);
    } catch (error) {
      console.warn('PostgreSQL 不可用，回退到内存存储:', error);
      return memoryStore.getChannelById(id);
    }
  }
  return memoryStore.getChannelById(id);
}

export async function getSamplesByChannel(channelId: string) {
  if (USE_POSTGRES) {
    try {
      return await dbRepo.getSamplesByChannelDB(channelId);
    } catch (error) {
      console.warn('PostgreSQL 不可用，回退到内存存储:', error);
      return memoryStore.getSamplesByChannel(channelId);
    }
  }
  return memoryStore.getSamplesByChannel(channelId);
}

export async function getReviewQueue(status?: string, channelId?: string) {
  if (USE_POSTGRES) {
    try {
      return await dbRepo.getReviewQueueDB(status, channelId);
    } catch (error) {
      console.warn('PostgreSQL 不可用，回退到内存存储:', error);
      return memoryStore.getReviewQueue(status, channelId);
    }
  }
  return memoryStore.getReviewQueue(status, channelId);
}

export async function getPendingReviewCount() {
  if (USE_POSTGRES) {
    try {
      return await dbRepo.getPendingReviewCountDB();
    } catch (error) {
      console.warn('PostgreSQL 不可用，回退到内存存储:', error);
      return memoryStore.getPendingReviewCount();
    }
  }
  return memoryStore.getPendingReviewCount();
}

export async function getDurationBins(channelId?: string) {
  if (USE_POSTGRES) {
    try {
      return await dbRepo.getDurationBinsDB(channelId);
    } catch (error) {
      console.warn('PostgreSQL 不可用，回退到内存存储:', error);
      return memoryStore.getDurationBins(channelId);
    }
  }
  return memoryStore.getDurationBins(channelId);
}

export async function getDeviceAggregation(channelId?: string) {
  if (USE_POSTGRES) {
    try {
      return await dbRepo.getDeviceAggregationDB(channelId);
    } catch (error) {
      console.warn('PostgreSQL 不可用，回退到内存存储:', error);
      return memoryStore.getDeviceAggregation(channelId);
    }
  }
  return memoryStore.getDeviceAggregation(channelId);
}

export async function getIpRegionAggregation(channelId?: string) {
  if (USE_POSTGRES) {
    try {
      return await dbRepo.getIpRegionAggregationDB(channelId);
    } catch (error) {
      console.warn('PostgreSQL 不可用，回退到内存存储:', error);
      return memoryStore.getIpRegionAggregation(channelId);
    }
  }
  return memoryStore.getIpRegionAggregation(channelId);
}

export async function getAbnormalSamples(channelId?: string) {
  if (USE_POSTGRES) {
    try {
      return await dbRepo.getAbnormalSamplesDB(channelId);
    } catch (error) {
      console.warn('PostgreSQL 不可用，回退到内存存储:', error);
      return memoryStore.getAbnormalSamples(channelId);
    }
  }
  return memoryStore.getAbnormalSamples(channelId);
}

export async function batchReview(
  ids: string[],
  action: 'approved' | 'rejected',
  reviewer: string = '调研经理'
) {
  if (USE_POSTGRES) {
    try {
      return await dbRepo.batchReviewDB(ids, action, reviewer);
    } catch (error) {
      console.warn('PostgreSQL 不可用，回退到内存存储:', error);
      return memoryStore.batchReview(ids, action, reviewer);
    }
  }
  return memoryStore.batchReview(ids, action, reviewer);
}

export async function getSampleById(id: string) {
  if (USE_POSTGRES) {
    try {
      return await dbRepo.getSampleByIdDB(id);
    } catch (error) {
      console.warn('PostgreSQL 不可用，回退到内存存储:', error);
      return memoryStore.getSampleById(id);
    }
  }
  return memoryStore.getSampleById(id);
}
