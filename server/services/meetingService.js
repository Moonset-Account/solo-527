/**
 * 会议与转写导入服务
 */
const fs = require('fs');
const { getDb } = require('../db');
const logger = require('../utils/logger');
const { uuid, now, parseJsonSafe, stringifyIfNeeded } = require('../utils/common');
const cleaner = require('./dataCleaning');
const queue = require('../queue');
const audit = require('../audit');

async function importTranscript(opts) {
  const {
    title,
    projectName = null,
    meetingDate,
    duration = null,
    location = null,
    rawContent,
    sourceFormat = 'auto',
    source = 'manual',
    metadata = {},
    operatorName = 'system',
  } = opts;

  const db = getDb();
  const meetingId = uuid();

  const parsed = cleaner.parseTranscript(rawContent, sourceFormat);

  const tx = db.transaction(() => {
    const meetingStmt = db.prepare(`
      INSERT INTO meetings (id, title, project_name, meeting_date, duration, location, transcript, raw_source, status, created_at, updated_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'imported', ?, ?, ?)
    `);
    const fullTranscript = parsed.segments.map(s => (s.speaker ? `[${s.speaker}] ` : '') + s.content).join('\n');
    meetingStmt.run(
      meetingId,
      title,
      projectName,
      meetingDate,
      duration,
      location,
      fullTranscript,
      rawContent.slice(0, 500000),
      now(),
      now(),
      JSON.stringify({ source, format: parsed.format, ...metadata })
    );

    const speakersMap = new Map();
    parsed.segments.forEach(s => {
      if (s.speaker && !speakersMap.has(s.speaker)) {
        speakersMap.set(s.speaker, {
          id: uuid(),
          name: s.speaker,
          role: null,
          rawAlias: s.speaker,
          confirmed: 0,
        });
      }
    });

    const speakerStmt = db.prepare(`
      INSERT INTO speakers (id, meeting_id, speaker_name, speaker_role, raw_alias, confirmed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const sp of speakersMap.values()) {
      speakerStmt.run(sp.id, meetingId, sp.name, sp.role, sp.rawAlias, sp.confirmed, now());
    }

    const segStmt = db.prepare(`
      INSERT INTO transcript_segments (id, meeting_id, speaker_id, segment_index, start_time, end_time, content, topic_tag, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    parsed.segments.forEach((s, i) => {
      const speakerObj = s.speaker ? speakersMap.get(s.speaker) : null;
      segStmt.run(
        uuid(),
        meetingId,
        speakerObj ? speakerObj.id : null,
        i,
        s.start_time,
        s.end_time,
        s.content,
        null,
        now()
      );
    });

    audit.log(audit.ENTITY_TYPES.MEETING, meetingId, audit.ACTIONS.CREATE, {
      newValue: { title, projectName, segmentsCount: parsed.segments.length, speakersCount: speakersMap.size },
      operatorName,
    });
  });

  tx();

  logger.info(`[import] Meeting ${meetingId} imported: ${parsed.segments.length} segments, ${new Set(parsed.segments.map(s => s.speaker).filter(Boolean)).size} speakers`);

  await queue.addJob(queue.QUEUE_NAMES.TRANSCRIPT_PARSE, {
    meetingId,
    trigger: 'import',
  });

  return { meetingId, segmentsCount: parsed.segments.length };
}

function listMeetings(opts = {}) {
  const db = getDb();
  const { status = null, project = null, limit = 50, offset = 0, keyword = null } = opts;
  let sql = 'SELECT * FROM meetings WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (project) { sql += ' AND project_name = ?'; params.push(project); }
  if (keyword) {
    sql += ' AND (title LIKE ? OR transcript LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  sql += ' ORDER BY meeting_date DESC, created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = db.prepare(sql).all(...params);
  return rows.map(r => ({
    ...r,
    metadata: parseJsonSafe(r.metadata, {}),
  }));
}

function getMeetingDetail(meetingId) {
  const db = getDb();
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
  if (!meeting) return null;

  meeting.metadata = parseJsonSafe(meeting.metadata, {});

  meeting.speakers = db.prepare('SELECT * FROM speakers WHERE meeting_id = ? ORDER BY created_at').all(meetingId);

  meeting.segments = db.prepare(`
    SELECT ts.*, sp.speaker_name 
    FROM transcript_segments ts 
    LEFT JOIN speakers sp ON ts.speaker_id = sp.id
    WHERE ts.meeting_id = ? 
    ORDER BY ts.segment_index ASC
  `).all(meetingId);

  meeting.topics = db.prepare('SELECT * FROM topics WHERE meeting_id = ? ORDER BY start_segment_index ASC').all(meetingId);

  meeting.actionItems = db.prepare('SELECT * FROM action_items WHERE meeting_id = ? ORDER BY created_at ASC').all(meetingId);

  return meeting;
}

function updateMeeting(meetingId, patch, operatorName = 'system') {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId);
  if (!existing) throw new Error('Meeting not found');

  const allowed = ['title', 'project_name', 'meeting_date', 'duration', 'location', 'status', 'metadata'];
  const sets = [];
  const values = [];
  for (const k of allowed) {
    if (patch[k] !== undefined) {
      sets.push(`${k} = ?`);
      values.push(k === 'metadata' ? stringifyIfNeeded(patch[k]) : patch[k]);
    }
  }
  if (sets.length === 0) return existing;

  sets.push('updated_at = ?');
  values.push(now(), meetingId);
  db.prepare(`UPDATE meetings SET ${sets.join(', ')} WHERE id = ?`).run(...values);

  audit.log(audit.ENTITY_TYPES.MEETING, meetingId, audit.ACTIONS.UPDATE, {
    oldValue: pickFromObj(existing, allowed),
    newValue: patch,
    operatorName,
  });

  return getMeetingDetail(meetingId);
}

function deleteMeeting(meetingId, operatorName = 'system') {
  const db = getDb();
  db.prepare('DELETE FROM meetings WHERE id = ?').run(meetingId);
  audit.log(audit.ENTITY_TYPES.MEETING, meetingId, audit.ACTIONS.DELETE, { operatorName });
}

function getSpeakers(meetingId) {
  return getDb().prepare('SELECT * FROM speakers WHERE meeting_id = ?').all(meetingId);
}

function confirmSpeaker(speakerId, confirmedName, role = null, operatorName = 'system') {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM speakers WHERE id = ?').get(speakerId);
  if (!existing) throw new Error('Speaker not found');

  db.prepare(`UPDATE speakers SET speaker_name = ?, speaker_role = ?, confirmed = 1 WHERE id = ?`)
    .run(confirmedName, role, speakerId);

  audit.log(audit.ENTITY_TYPES.SPEAKER, speakerId, audit.ACTIONS.CONFIRM, {
    oldValue: { speaker_name: existing.speaker_name, role: existing.speaker_role, confirmed: existing.confirmed },
    newValue: { speaker_name: confirmedName, role, confirmed: 1 },
    operatorName,
  });
}

function pickFromObj(obj, keys) {
  const o = {};
  for (const k of keys) if (obj[k] !== undefined) o[k] = obj[k];
  return o;
}

module.exports = {
  importTranscript,
  listMeetings,
  getMeetingDetail,
  updateMeeting,
  deleteMeeting,
  getSpeakers,
  confirmSpeaker,
};
