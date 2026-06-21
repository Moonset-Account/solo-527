import { mockDailySummary, mockPushRecords } from '$lib/mock/data';
import type { DailySummary, PushRecord } from '$types';
import { generateUUID } from '$utils';

export async function getSummaryByDate(date: string): Promise<DailySummary | undefined> {
  if (date === mockDailySummary.date) {
    return mockDailySummary;
  }
  return undefined;
}

export async function getLatestSummary(): Promise<DailySummary | undefined> {
  return mockDailySummary;
}

export async function generateSummary(date: string): Promise<DailySummary> {
  const summary: DailySummary = {
    id: generateUUID(),
    date,
    content: `这是${date}的日报摘要。整体数据表现良好，各项指标稳中有升。`,
    highlights: ['亮点1', '亮点2'],
    lows: ['注意点1'],
    generatedBy: 'system',
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft'
  };
  return summary;
}

export async function updateSummary(id: string, data: Partial<DailySummary>): Promise<DailySummary | undefined> {
  if (mockDailySummary.id === id) {
    Object.assign(mockDailySummary, data, { updatedAt: new Date().toISOString() });
    return mockDailySummary;
  }
  return undefined;
}

export async function getPushRecords(summaryId?: string): Promise<PushRecord[]> {
  if (summaryId) {
    return mockPushRecords.filter((r) => r.summaryId === summaryId);
  }
  return mockPushRecords;
}

export async function createPushRecord(
  summaryId: string,
  channel: PushRecord['channel'],
  recipients: string[]
): Promise<PushRecord> {
  const record: PushRecord = {
    id: generateUUID(),
    summaryId,
    channel,
    recipients,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  mockPushRecords.push(record);
  setTimeout(() => {
    record.status = 'sent';
    record.sentAt = new Date().toISOString();
  }, 2000);
  return record;
}
