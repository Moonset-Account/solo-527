import { json, error } from '@sveltejs/kit';
import { getLatestSummary, getSummaryByDate, generateSummary, updateSummary } from '$server/services/summary';

export async function GET({ url }) {
  const date = url.searchParams.get('date') || undefined;

  try {
    if (date) {
      const summary = await getSummaryByDate(date);
      return json(summary || null);
    }
    const summary = await getLatestSummary();
    return json(summary);
  } catch (e) {
    console.error('Error fetching summary:', e);
    error(500, '获取日报摘要失败');
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { date } = body;
    const summary = await generateSummary(date);
    return json(summary, { status: 201 });
  } catch (e) {
    console.error('Error generating summary:', e);
    error(500, '生成日报摘要失败');
  }
}

export async function PATCH({ request }) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const summary = await updateSummary(id, data);
    if (!summary) {
      error(404, '摘要不存在');
    }
    return json(summary);
  } catch (e) {
    console.error('Error updating summary:', e);
    error(500, '更新日报摘要失败');
  }
}
