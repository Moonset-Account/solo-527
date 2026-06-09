import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  db,
  uuidv4,
  mapModelVersion,
  DbModelVersionRow,
} from '../db/database.js';
import type { ModelVersion } from '#shared/types';
import EvaluationService from './EvaluationService.js';

export class TrainingService {
  listVersions(): ModelVersion[] {
    const rows = db.prepare('SELECT * FROM model_versions ORDER BY created_at DESC').all() as DbModelVersionRow[];
    return rows.map(mapModelVersion);
  }

  activate(id: string): ModelVersion | null {
    const row = db.prepare('SELECT * FROM model_versions WHERE id = ?').get(id) as DbModelVersionRow | undefined;
    if (!row) return null;
    if (row.status !== 'ready') throw new Error('模型尚未就绪，无法激活');

    const tx = db.transaction(() => {
      db.prepare('UPDATE model_versions SET is_active = 0').run();
      db.prepare('UPDATE model_versions SET is_active = 1 WHERE id = ?').run(id);
    });
    tx();
    return this.getById(id);
  }

  getById(id: string): ModelVersion | null {
    const row = db.prepare('SELECT * FROM model_versions WHERE id = ?').get(id) as DbModelVersionRow | undefined;
    return row ? mapModelVersion(row) : null;
  }

  async startFineTune(
    opts: {
      name?: string;
      baseModel?: string;
      useRealOpenAI?: boolean;
    } = {},
  ): Promise<ModelVersion> {
    const apiKey = process.env.OPENAI_API_KEY || '';
    const useReal = (opts.useRealOpenAI ?? true) && apiKey && apiKey !== 'demo';
    const baseModel = opts.baseModel || 'gpt-4o-mini';
    const now = new Date().toISOString();
    const versionId = uuidv4();
    const name = opts.name || `微调版本 ${new Date().toISOString().slice(0, 10)}`;

    db.prepare(`
      INSERT INTO model_versions (id, name, openai_finetune_id, base_model, status, is_active, metrics_json, created_at)
      VALUES (?, ?, NULL, ?, 'pending', 0, NULL, ?)
    `).run(versionId, name, baseModel, now);

    const { samples } = EvaluationService.exportJsonl({ minQuality: 75 });
    const lines = samples.map((s) => JSON.stringify(s)).join('\n');

    if (!useReal) {
      this.simulateTrainingProgress(versionId);
      return this.getById(versionId)!;
    }

    try {
      const client = new OpenAI({ apiKey });
      const tmpFile = path.join(os.tmpdir(), `ft-samples-${versionId}.jsonl`);
      fs.writeFileSync(tmpFile, lines, 'utf-8');

      const uploaded = await client.files.create({
        file: fs.createReadStream(tmpFile),
        purpose: 'fine-tune',
      });

      const ftJob = await client.fineTuning.jobs.create({
        training_file: uploaded.id,
        model: baseModel,
        suffix: 'meeting-actions',
      });

      db.prepare('UPDATE model_versions SET openai_finetune_id = ?, status = ? WHERE id = ?').run(
        ftJob.id,
        'running',
        versionId,
      );

      this.pollOpenAIStatus(versionId, ftJob.id);
      return this.getById(versionId)!;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      db.prepare("UPDATE model_versions SET status = 'failed', metrics_json = ? WHERE id = ?").run(
        JSON.stringify({ error: msg }),
        versionId,
      );
      throw err;
    }
  }

  private simulateTrainingProgress(versionId: string): void {
    setTimeout(() => {
      db.prepare("UPDATE model_versions SET status = 'running' WHERE id = ? AND status = 'pending'").run(versionId);
    }, 1000);

    setTimeout(() => {
      const precision = 0.8 + Math.random() * 0.15;
      const recall = 0.75 + Math.random() * 0.18;
      const f1 = (2 * precision * recall) / (precision + recall);
      const metrics = { precision, recall, f1, sampleCount: 32, epochs: 3 };
      db.prepare("UPDATE model_versions SET status = 'ready', metrics_json = ? WHERE id = ?").run(
        JSON.stringify(metrics),
        versionId,
      );
    }, 5000);
  }

  private pollOpenAIStatus(versionId: string, ftJobId: string): void {
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey || apiKey === 'demo') return;
    const client = new OpenAI({ apiKey });
    let attempts = 0;
    const maxAttempts = 60;

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        return;
      }
      try {
        const job = await client.fineTuning.jobs.retrieve(ftJobId);
        if (job.status === 'succeeded') {
          const resultFiles = job.result_files || [];
          db.prepare("UPDATE model_versions SET status = 'ready' WHERE id = ?").run(versionId);
          clearInterval(interval);
        } else if (job.status === 'failed' || job.status === 'cancelled') {
          db.prepare("UPDATE model_versions SET status = 'failed' WHERE id = ?").run(versionId);
          clearInterval(interval);
        }
      } catch {
        // retry later
      }
    }, 60000);
  }
}

export default new TrainingService();
