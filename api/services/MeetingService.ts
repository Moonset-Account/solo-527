import {
  db,
  uuidv4,
  mapMeeting,
  mapSegment,
  mapActionItem,
  DbMeetingRow,
  DbSegmentRow,
  DbActionItemRow,
} from '../db/database.js';
import type {
  Meeting,
  MeetingListItem,
  TranscriptSegment,
  Speaker,
  ActionItem,
} from '#shared/types';
import MaskingService from './MaskingService.js';
import ExtractionService from './ExtractionService.js';

export interface CreateMeetingInput {
  title: string;
  date: string;
  projectId: string;
  speakers: Speaker[];
  topics: string[];
  transcript: TranscriptSegment[];
  createdBy: string;
}

export interface ImportTranscriptInput {
  transcript: TranscriptSegment[];
  applyMasking?: boolean;
}

export class MeetingService {
  list(params?: { projectId?: string; status?: Meeting['status']; createdBy?: string }): MeetingListItem[] {
    let sql = 'SELECT * FROM meetings WHERE 1=1';
    const bind: unknown[] = [];

    if (params?.projectId) {
      sql += ' AND project_id = ?';
      bind.push(params.projectId);
    }
    if (params?.status) {
      sql += ' AND status = ?';
      bind.push(params.status);
    }
    if (params?.createdBy) {
      sql += ' AND created_by = ?';
      bind.push(params.createdBy);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...bind) as DbMeetingRow[];

    return rows.map((row) => {
      const itemCountStmt = db.prepare('SELECT COUNT(*) as c FROM action_items WHERE meeting_id = ?');
      const countRes = itemCountStmt.get(row.id) as { c: number };
      const base = mapMeeting(row);
      return {
        ...base,
        actionItemCount: countRes.c,
        transcript: [],
      };
    });
  }

  getById(id: string): Meeting | null {
    const row = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as DbMeetingRow | undefined;
    if (!row) return null;

    const segRows = db
      .prepare('SELECT * FROM transcript_segments WHERE meeting_id = ? ORDER BY char_offset, id')
      .all(id) as DbSegmentRow[];
    const segments = segRows.map(mapSegment);

    return mapMeeting(row, segments);
  }

  create(input: CreateMeetingInput): Meeting {
    const now = new Date().toISOString();
    const meetingId = uuidv4();

    const insertMeeting = db.prepare(`
      INSERT INTO meetings (id, title, meeting_date, project_id, speakers_json, topics_json, status, masking_applied, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertSegment = db.prepare(`
      INSERT INTO transcript_segments (id, meeting_id, speaker_id, start_time, end_time, text, original_text, char_offset)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let charOffset = 0;
    const processedSegments: TranscriptSegment[] = input.transcript.map((seg) => ({
      ...seg,
      id: seg.id || uuidv4(),
      charOffset: (() => {
        const offset = charOffset;
        charOffset += seg.text.length + 1;
        return offset;
      })(),
    }));

    const tx = db.transaction(() => {
      insertMeeting.run(
        meetingId,
        input.title,
        input.date,
        input.projectId,
        JSON.stringify(input.speakers || []),
        JSON.stringify(input.topics || []),
        'created',
        0,
        input.createdBy,
        now,
      );

      for (const seg of processedSegments) {
        insertSegment.run(
          seg.id,
          meetingId,
          seg.speakerId,
          seg.startTime ?? null,
          seg.endTime ?? null,
          seg.text,
          seg.originalText ?? null,
          seg.charOffset ?? 0,
        );
      }
    });

    tx();
    return this.getById(meetingId)!;
  }

  delete(id: string): boolean {
    const res = db.prepare('DELETE FROM meetings WHERE id = ?').run(id);
    return res.changes > 0;
  }

  importTranscript(meetingId: string, input: ImportTranscriptInput): TranscriptSegment[] {
    const applyMasking = input.applyMasking ?? true;
    db.prepare('DELETE FROM transcript_segments WHERE meeting_id = ?').run(meetingId);
    db.prepare('DELETE FROM masking_map_entries WHERE meeting_id = ?').run(meetingId);

    const insertSegment = db.prepare(`
      INSERT INTO transcript_segments (id, meeting_id, speaker_id, start_time, end_time, text, original_text, char_offset)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let charOffset = 0;
    const resultSegments: TranscriptSegment[] = [];

    const tx = db.transaction(() => {
      for (const rawSeg of input.transcript) {
        const segId = rawSeg.id || uuidv4();
        const originalText = rawSeg.text;
        let processedText = originalText;

        if (applyMasking) {
          const maskResult = MaskingService.maskText(originalText, meetingId);
          processedText = maskResult.maskedText;
        }

        const seg: TranscriptSegment = {
          id: segId,
          speakerId: rawSeg.speakerId,
          startTime: rawSeg.startTime,
          endTime: rawSeg.endTime,
          text: processedText,
          originalText: applyMasking ? originalText : undefined,
          charOffset,
        };
        charOffset += processedText.length + 1;
        resultSegments.push(seg);

        insertSegment.run(
          seg.id,
          meetingId,
          seg.speakerId,
          seg.startTime ?? null,
          seg.endTime ?? null,
          seg.text,
          seg.originalText ?? null,
          seg.charOffset,
        );
      }

      db.prepare('UPDATE meetings SET masking_applied = ? WHERE id = ?').run(applyMasking ? 1 : 0, meetingId);
    });

    tx();
    return resultSegments;
  }

  async triggerExtraction(meetingId: string, userId: string): Promise<ActionItem[]> {
    const meeting = this.getById(meetingId);
    if (!meeting) throw new Error('会议不存在');

    db.prepare("UPDATE meetings SET status = 'extracting' WHERE id = ?").run(meetingId);

    try {
      const segments = meeting.transcript.length > 0
        ? meeting.transcript
        : (() => {
            const segRows = db
              .prepare('SELECT * FROM transcript_segments WHERE meeting_id = ? ORDER BY char_offset')
              .all(meetingId) as DbSegmentRow[];
            return segRows.map(mapSegment);
          })();

      const { items, promptTokens, completionTokens, modelName } = await ExtractionService.extractActionItems(
        meetingId,
        segments,
        userId,
      );

      db.prepare("UPDATE meetings SET status = 'extracted', extraction_error = NULL WHERE id = ?").run(meetingId);

      return items;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      db.prepare("UPDATE meetings SET status = 'failed', extraction_error = ? WHERE id = ?").run(msg, meetingId);
      throw err;
    }
  }

  getActionItems(meetingId: string): ActionItem[] {
    const rows = db
      .prepare('SELECT * FROM action_items WHERE meeting_id = ? ORDER BY created_at')
      .all(meetingId) as DbActionItemRow[];
    return rows.map(mapActionItem);
  }
}

export default new MeetingService();
