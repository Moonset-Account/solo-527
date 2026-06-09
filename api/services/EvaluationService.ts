import {
  db,
  uuidv4,
  mapActionItem,
  mapSegment,
  DbActionItemRow,
  DbSegmentRow,
} from '../db/database.js';
import type {
  ActionItem,
  EvaluationReport,
  FieldName,
  TranscriptSegment,
} from '#shared/types';
import ExtractionService from './ExtractionService.js';

interface FieldMetrics {
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
}

const COMPARABLE_FIELDS: FieldName[] = ['content', 'assignee', 'dueDate', 'topic', 'milestone', 'priority'];

function normalize(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().toLowerCase();
}

function fieldsMatch(a: unknown, b: unknown): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na && !nb) return true;
  if (!na || !nb) return false;
  if (na.includes(nb) || nb.includes(na)) return true;
  return na === nb;
}

export interface JsonlSample {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

export class EvaluationService {
  async generateReport(params?: { modelVersion?: string }): Promise<EvaluationReport> {
    const allItems = db.prepare(`
      SELECT * FROM action_items
      WHERE status IN ('confirmed', 'assigned', 'in_progress', 'completed')
      ORDER BY created_at
    `).all() as DbActionItemRow[];

    if (allItems.length === 0) {
      const activeModel = ExtractionService.getActiveModel();
      return {
        generatedAt: new Date().toISOString(),
        totalSamples: 0,
        overall: { precision: 0, recall: 0, f1: 0 },
        perField: {},
        errorDistribution: { missing: 0, lowConfidence: 0, wrongAssignee: 0, wrongDate: 0, other: 0 },
        modelVersion: params?.modelVersion || activeModel.name,
      };
    }

    const perFieldStats: Record<string, { tp: number; fp: number; fn: number; correct: number; total: number }> = {};
    for (const f of COMPARABLE_FIELDS) perFieldStats[f] = { tp: 0, fp: 0, fn: 0, correct: 0, total: 0 };

    let totalTp = 0;
    let totalFp = 0;
    let totalFn = 0;

    let missingCount = 0;
    let lowConfCount = 0;
    let wrongAssignee = 0;
    let wrongDate = 0;
    let otherCount = 0;

    for (const row of allItems) {
      const item = mapActionItem(row);
      const histories = db.prepare('SELECT * FROM version_history WHERE action_item_id = ? ORDER BY version').all(item.id) as unknown[];
      const aiInitial = histories.length > 0 ? (histories[0] as unknown as { snapshot_json: string }).snapshot_json : null;
      let initialSnapshot: Partial<ActionItem> | null = null;
      if (aiInitial) {
        try {
          initialSnapshot = JSON.parse(aiInitial) as Partial<ActionItem>;
        } catch {
          initialSnapshot = null;
        }
      }

      const hasOtherErrors: string[] = [];

      for (const field of COMPARABLE_FIELDS) {
        const aiVal = initialSnapshot
          ? (initialSnapshot as unknown as Record<string, unknown>)[field]
          : (item as unknown as Record<string, unknown>)[field];
        const humanVal = (item as unknown as Record<string, unknown>)[field];
        perFieldStats[field].total++;

        const aiHas = aiVal !== null && aiVal !== undefined && String(aiVal).trim() !== '';
        const humanHas = humanVal !== null && humanVal !== undefined && String(humanVal).trim() !== '';

        if (aiHas && humanHas) {
          if (fieldsMatch(aiVal, humanVal)) {
            perFieldStats[field].tp++;
            perFieldStats[field].correct++;
            totalTp++;
          } else {
            perFieldStats[field].fp++;
            perFieldStats[field].fn++;
            totalFp++;
            totalFn++;
            hasOtherErrors.push(field);
          }
        } else if (aiHas && !humanHas) {
          perFieldStats[field].fp++;
          totalFp++;
          hasOtherErrors.push(field);
        } else if (!aiHas && humanHas) {
          perFieldStats[field].fn++;
          totalFn++;
          hasOtherErrors.push(field);
        } else {
          perFieldStats[field].correct++;
          perFieldStats[field].tp++;
          totalTp++;
        }

        if (humanHas && fieldsMatch(aiVal, humanVal)) {
          // already counted correct
        }
      }

      if (item.missingFields.length > 0) missingCount++;
      if (item.lowConfidenceFields.length > 0) lowConfCount++;
      if (hasOtherErrors.includes('assignee')) wrongAssignee++;
      if (hasOtherErrors.includes('dueDate')) wrongDate++;
      const otherErrors = hasOtherErrors.filter((f) => f !== 'assignee' && f !== 'dueDate');
      if (otherErrors.length > 0) otherCount++;
    }

    const precision = totalTp + totalFp > 0 ? totalTp / (totalTp + totalFp) : 0;
    const recall = totalTp + totalFn > 0 ? totalTp / (totalTp + totalFn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    const perField: Record<string, FieldMetrics> = {};
    for (const field of COMPARABLE_FIELDS) {
      const s = perFieldStats[field];
      const p = s.tp + s.fp > 0 ? s.tp / (s.tp + s.fp) : 0;
      const r = s.tp + s.fn > 0 ? s.tp / (s.tp + s.fn) : 0;
      const f = p + r > 0 ? (2 * p * r) / (p + r) : 0;
      const acc = s.total > 0 ? s.correct / s.total : 0;
      perField[field] = { precision: p, recall: r, f1: f, accuracy: acc };
    }

    const activeModel = ExtractionService.getActiveModel();

    return {
      generatedAt: new Date().toISOString(),
      totalSamples: allItems.length,
      overall: { precision, recall, f1 },
      perField,
      errorDistribution: {
        missing: missingCount,
        lowConfidence: lowConfCount,
        wrongAssignee,
        wrongDate,
        other: otherCount,
      },
      modelVersion: params?.modelVersion || activeModel.name,
    };
  }

  exportJsonl(params?: { minQuality?: number }): { samples: JsonlSample[]; count: number } {
    const confirmedItems = db.prepare(`
      SELECT * FROM action_items
      WHERE status IN ('confirmed', 'assigned', 'in_progress', 'completed')
      ORDER BY created_at
    `).all() as DbActionItemRow[];

    const samples: JsonlSample[] = [];
    const systemContent = '你是会议行动项抽取专家。请从会议转写中抽取结构化行动项，返回 JSON。';

    for (const row of confirmedItems) {
      const item = mapActionItem(row);
      const segRows = db.prepare(`
        SELECT * FROM transcript_segments WHERE meeting_id = ? ORDER BY char_offset
      `).all(item.meetingId) as unknown[];
      const segments = segRows.map((r) => mapSegment(r as never)) as TranscriptSegment[];
      const transcript = segments.map((s) => `[${s.id}] ${s.text}`).join('\n\n');

      const assistantObj = {
        content: item.content,
        assignee: item.assignee,
        dueDate: item.dueDate,
        topic: item.topic,
        milestone: item.milestoneId,
        priority: item.priority,
      };

      samples.push({
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: `会议转写：\n${transcript}\n\n请抽取行动项。` },
          { role: 'assistant', content: JSON.stringify(assistantObj) },
        ],
      });

      const payload = {
        meetingId: item.meetingId,
        actionItemId: item.id,
        sample: assistantObj,
      };

      db.prepare(`
        INSERT OR IGNORE INTO evaluation_samples (id, meeting_id, action_item_id, source, payload_json, quality_score, created_at)
        VALUES (?, ?, ?, 'human', ?, ?, ?)
      `).run(
        uuidv4(),
        item.meetingId,
        item.id,
        JSON.stringify(payload),
        params?.minQuality ?? 80,
        new Date().toISOString(),
      );
    }

    return { samples, count: samples.length };
  }

  toJsonlLines(samples: JsonlSample[]): string {
    return samples.map((s) => JSON.stringify(s)).join('\n');
  }
}

export default new EvaluationService();
