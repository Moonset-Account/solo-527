import { json, error } from '@sveltejs/kit';
import { getPushRecords, createPushRecord } from '$server/services/summary';

export async function GET({ url }) {
  const summaryId = url.searchParams.get('summaryId') || undefined;

  try {
    const records = await getPushRecords(summaryId);
    return json(records);
  } catch (e) {
    console.error('Error fetching push records:', e);
    error(500, '获取推送记录失败');
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { summaryId, channel, recipients } = body;
    const record = await createPushRecord(summaryId, channel, recipients);
    return json(record, { status: 201 });
  } catch (e) {
    console.error('Error creating push record:', e);
    error(500, '创建推送任务失败');
  }
}
