import { db, uuidv4, mapMaskingRule, mapMaskingMapEntry, DbMaskingRuleRow, DbMaskingMapEntryRow } from '../db/database.js';
import type { MaskingRule, MaskingMapEntry } from '#shared/types';

export interface MaskingResult {
  maskedText: string;
  entries: MaskingMapEntry[];
}

export class MaskingService {
  getEnabledRules(): MaskingRule[] {
    const rows = db.prepare('SELECT * FROM masking_rules WHERE enabled = 1').all() as DbMaskingRuleRow[];
    return rows.map(mapMaskingRule);
  }

  getAllRules(): MaskingRule[] {
    const rows = db.prepare('SELECT * FROM masking_rules ORDER BY id').all() as DbMaskingRuleRow[];
    return rows.map(mapMaskingRule);
  }

  maskText(text: string, meetingId: string): MaskingResult {
    const rules = this.getEnabledRules();
    if (rules.length === 0) {
      return { maskedText: text, entries: [] };
    }

    const entries: MaskingMapEntry[] = [];
    let maskedText = text;

    for (const rule of rules) {
      let regex: RegExp;
      try {
        if (rule.type === 'regex') {
          regex = new RegExp(rule.pattern, 'g');
        } else {
          const keywords = rule.pattern.split('|').map((k) => k.trim()).filter(Boolean);
          regex = new RegExp(keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
        }
      } catch {
        continue;
      }

      let match: RegExpExecArray | null;
      const matches: { value: string; start: number; end: number }[] = [];
      while ((match = regex.exec(maskedText)) !== null) {
        matches.push({ value: match[0], start: match.index, end: match.index + match[0].length });
      }

      for (let i = matches.length - 1; i >= 0; i--) {
        const m = matches[i];
        const existingEntry = entries.find((e) => e.originalValue === m.value);
        const maskedToken = existingEntry ? existingEntry.maskedToken : `${rule.replacement}_${entries.filter((e) => e.ruleId === rule.id).length + 1}`;

        if (!existingEntry) {
          const entry: MaskingMapEntry = {
            id: uuidv4(),
            meetingId,
            maskedToken,
            originalValue: m.value,
            ruleId: rule.id,
            createdAt: new Date().toISOString(),
          };
          entries.push(entry);
        }

        maskedText = maskedText.slice(0, m.start) + maskedToken + maskedText.slice(m.end);
      }
    }

    const insertEntry = db.prepare(`
      INSERT INTO masking_map_entries (id, meeting_id, masked_token, original_value, rule_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const entry of entries) {
      insertEntry.run(
        entry.id,
        entry.meetingId,
        entry.maskedToken,
        entry.originalValue,
        entry.ruleId ?? null,
        entry.createdAt,
      );
    }

    return { maskedText, entries };
  }

  unmaskText(maskedText: string, meetingId: string): string {
    const rows = db
      .prepare('SELECT * FROM masking_map_entries WHERE meeting_id = ?')
      .all(meetingId) as ReturnType<typeof db.prepare> extends { all: (...args: unknown[]) => infer R } ? R : never;
    const entries = (rows as unknown[]).map((r) => mapMaskingMapEntry(r as never)) as MaskingMapEntry[];

    let result = maskedText;
    const sorted = [...entries].sort((a, b) => b.maskedToken.length - a.maskedToken.length);
    for (const entry of sorted) {
      result = result.split(entry.maskedToken).join(entry.originalValue);
    }
    return result;
  }

  getEntriesByMeeting(meetingId: string): MaskingMapEntry[] {
    const rows = db
      .prepare('SELECT * FROM masking_map_entries WHERE meeting_id = ? ORDER BY created_at')
      .all(meetingId) as unknown[];
    return (rows as unknown[]).map((r) => mapMaskingMapEntry(r as never)) as MaskingMapEntry[];
  }
}

export default new MaskingService();
