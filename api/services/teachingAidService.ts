import { db } from '../db.js';

export function list() {
  const result: any[] = [];
  for (const [, aid] of db.teachingAids) {
    result.push(aid);
  }
  return result;
}

export function create(data: any) {
  const id = db.getNextId(db.teachingAids);
  const aid = {
    id,
    name: data.name,
    total_quantity: data.total_quantity,
    available_quantity: data.total_quantity,
    status: data.status || 'available',
  };
  db.teachingAids.set(id, aid);
  return aid;
}

export function update(id: number, data: any) {
  const aid = db.teachingAids.get(id);
  if (!aid) return null;

  const updated = { ...aid, ...data, id: aid.id };
  if (data.total_quantity !== undefined) {
    const diff = data.total_quantity - aid.total_quantity;
    updated.available_quantity = aid.available_quantity + diff;
  }
  db.teachingAids.set(id, updated);
  return updated;
}

export function allocate(teaching_aid_id: number, session_id: number, quantity: number) {
  const aid = db.teachingAids.get(teaching_aid_id);
  if (!aid) return { error: '教具不存在' };

  const session = db.sessions.get(session_id);
  if (!session) return { error: '场次不存在' };

  if (quantity > aid.available_quantity) {
    return { error: `教具可用数量不足，当前可用 ${aid.available_quantity} 件` };
  }

  const id = db.getNextId(db.sessionTeachingAids);
  const allocation = {
    id,
    session_id,
    teaching_aid_id,
    quantity_allocated: quantity,
    returned: false,
  };
  db.sessionTeachingAids.set(id, allocation);

  aid.available_quantity -= quantity;
  if (aid.available_quantity === 0) {
    aid.status = 'in_use';
  }
  db.teachingAids.set(teaching_aid_id, aid);

  return { data: allocation };
}
