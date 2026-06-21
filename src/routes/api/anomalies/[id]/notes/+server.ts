import { json, error } from '@sveltejs/kit';
import { getAnomalyNotes, addAnomalyNote } from '$server/services/anomalies';

export async function GET({ params }) {
  try {
    const notes = await getAnomalyNotes(params.id);
    return json(notes);
  } catch (e) {
    console.error('Error fetching anomaly notes:', e);
    error(500, '获取备注失败');
  }
}

export async function POST({ params, request }) {
  try {
    const body = await request.json();
    const { content, author } = body;
    if (!content || !author) {
      error(400, '内容和作者不能为空');
    }
    const note = await addAnomalyNote(params.id, content, author);
    return json(note, { status: 201 });
  } catch (e) {
    console.error('Error adding anomaly note:', e);
    error(500, '添加备注失败');
  }
}
