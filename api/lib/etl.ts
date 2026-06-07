import { prisma } from './prisma';
import type { DataQualityStatus } from '@shared/types';

export interface EtlResult {
  success: boolean;
  recordsExtracted: number;
  recordsValidated: number;
  recordsLoaded: number;
  recordsFailed: number;
  errors: string[];
  missingFields: Record<string, number>;
  logId?: string;
}

export interface RawTrainingRecord {
  athleteId?: string;
  athleteName?: string;
  date?: string;
  sessionType?: string;
  durationMin?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  paceKmPerH?: number;
  distanceKm?: number;
  loadScore?: number;
  rpe?: number;
  source?: string;
}

export interface RawStrengthRecord {
  athleteId?: string;
  athleteName?: string;
  date?: string;
  exercise?: string;
  weightKg?: number;
  reps?: number;
  sets?: number;
  notes?: string;
}

export interface RawRecoveryRecord {
  athleteId?: string;
  athleteName?: string;
  date?: string;
  sleepScore?: number;
  hrv?: number;
  sorenessScore?: number;
  moodScore?: number;
  overallScore?: number;
  source?: string;
}

export interface RawInjuryRecord {
  athleteId?: string;
  athleteName?: string;
  date?: string;
  injuryType?: string;
  severity?: string;
  description?: string;
  notes?: string;
  status?: string;
  returnDate?: string;
}

export class EtlPipeline {
  private source: string;
  private errors: string[] = [];
  private missingFields: Record<string, number> = {};
  private logId: string | null = null;

  constructor(source: string = 'manual') {
    this.source = source;
  }

  async run(): Promise<EtlResult> {
    this.errors = [];
    this.missingFields = {};
    let extracted = 0;
    let validated = 0;
    let loaded = 0;
    let failed = 0;

    const log = await prisma.etlLog.create({
      data: {
        source: this.source,
        status: 'running',
      },
    });
    this.logId = log.id;

    try {
      const rawRecords = await this.extract();
      extracted = rawRecords.length;

      const validatedRecords = await this.validate(rawRecords);
      validated = validatedRecords.valid;
      failed += rawRecords.length - validatedRecords.valid;

      const loadResult = await this.load(validatedRecords.records);
      loaded = loadResult.loaded;
      failed += loadResult.failed;

      await this.markProcessed(validatedRecords.records);

      const finalStatus = failed > 0 && loaded === 0 ? 'failed' : 'completed';

      await prisma.etlLog.update({
        where: { id: log.id },
        data: {
          status: finalStatus,
          recordsExtracted: extracted,
          recordsValidated: validated,
          recordsLoaded: loaded,
          recordsFailed: failed,
          errors: this.errors.length > 0 ? this.errors.join('\n') : null,
          missingFields: JSON.stringify(this.missingFields),
          finishedAt: new Date(),
        },
      });

      return {
        success: finalStatus !== 'failed',
        recordsExtracted: extracted,
        recordsValidated: validated,
        recordsLoaded: loaded,
        recordsFailed: failed,
        errors: this.errors,
        missingFields: this.missingFields,
        logId: log.id,
      };
    } catch (err: any) {
      this.errors.push(err.message || 'ETL过程发生未知错误');

      await prisma.etlLog.update({
        where: { id: log.id },
        data: {
          status: 'failed',
          recordsExtracted: extracted,
          recordsValidated: validated,
          recordsLoaded: loaded,
          recordsFailed: extracted,
          errors: this.errors.join('\n'),
          missingFields: JSON.stringify(this.missingFields),
          finishedAt: new Date(),
        },
      });

      return {
        success: false,
        recordsExtracted: extracted,
        recordsValidated: validated,
        recordsLoaded: loaded,
        recordsFailed: extracted,
        errors: this.errors,
        missingFields: this.missingFields,
        logId: log.id,
      };
    }
  }

  private async extract(): Promise<any[]> {
    const pending = await prisma.rawDataRecord.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });

    const records: any[] = [];
    for (const rec of pending) {
      try {
        const payload = JSON.parse(rec.payload);
        records.push({
          id: rec.id,
          dataType: rec.dataType,
          sourceId: rec.sourceId,
          payload,
        });
      } catch (e) {
        this.trackMissing('raw_parse_error');
        this.errors.push(`原始记录 ${rec.id} 解析失败`);
      }
    }

    return records;
  }

  private trackMissing(field: string) {
    this.missingFields[field] = (this.missingFields[field] || 0) + 1;
  }

  private async validate(records: any[]): Promise<{ valid: number; records: any[] }> {
    const validRecords: any[] = [];

    for (const record of records) {
      let isValid = true;
      const { dataType, payload } = record;

      switch (dataType) {
        case 'training':
          if (!payload.athleteId && !payload.athleteName) {
            this.trackMissing('training_athlete_missing');
            isValid = false;
          }
          if (!payload.date) {
            this.trackMissing('training_date_missing');
            isValid = false;
          }
          if (!payload.sessionType) {
            this.trackMissing('training_session_type_missing');
            isValid = false;
          }
          if (!payload.durationMin || payload.durationMin <= 0) {
            this.trackMissing('training_duration_invalid');
            isValid = false;
          }
          if (payload.loadScore == null || payload.loadScore < 0) {
            this.trackMissing('training_load_invalid');
            isValid = false;
          }
          if (!payload.avgHeartRate) {
            this.trackMissing('training_heartrate_missing');
          }
          break;

        case 'strength':
          if (!payload.athleteId && !payload.athleteName) {
            this.trackMissing('strength_athlete_missing');
            isValid = false;
          }
          if (!payload.date) {
            this.trackMissing('strength_date_missing');
            isValid = false;
          }
          if (!payload.exercise) {
            this.trackMissing('strength_exercise_missing');
            isValid = false;
          }
          if (payload.weightKg == null || payload.weightKg <= 0) {
            this.trackMissing('strength_weight_invalid');
            isValid = false;
          }
          if (!payload.reps || payload.reps <= 0) {
            this.trackMissing('strength_reps_invalid');
            isValid = false;
          }
          if (!payload.sets || payload.sets <= 0) {
            this.trackMissing('strength_sets_invalid');
            isValid = false;
          }
          break;

        case 'recovery':
          if (!payload.athleteId && !payload.athleteName) {
            this.trackMissing('recovery_athlete_missing');
            isValid = false;
          }
          if (!payload.date) {
            this.trackMissing('recovery_date_missing');
            isValid = false;
          }
          if (payload.overallScore == null) {
            this.trackMissing('recovery_overall_missing');
            isValid = false;
          }
          break;

        case 'injury':
          if (!payload.athleteId && !payload.athleteName) {
            this.trackMissing('injury_athlete_missing');
            isValid = false;
          }
          if (!payload.date) {
            this.trackMissing('injury_date_missing');
            isValid = false;
          }
          if (!payload.injuryType) {
            this.trackMissing('injury_type_missing');
            isValid = false;
          }
          if (!payload.description) {
            this.trackMissing('injury_description_missing');
            isValid = false;
          }
          break;

        default:
          this.trackMissing(`unknown_type_${dataType}`);
          isValid = false;
      }

      if (isValid) {
        validRecords.push(record);
      } else {
        await prisma.rawDataRecord.update({
          where: { id: record.id },
          data: {
            status: 'failed',
            error: '字段缺失或格式错误',
            processedAt: new Date(),
            etlRunId: this.logId,
          },
        });
      }
    }

    return {
      valid: validRecords.length,
      records: validRecords,
    };
  }

  private async load(records: any[]): Promise<{ loaded: number; failed: number }> {
    let loaded = 0;
    let failed = 0;

    for (const record of records) {
      try {
        const { dataType, payload, id: rawDataId } = record;
        const athleteId = await this.resolveAthlete(payload);
        const date = new Date(payload.date);

        switch (dataType) {
          case 'training':
            const estimated1Rm = payload.weightKg && payload.reps
              ? Math.round(payload.weightKg * (1 + payload.reps / 30) * 10) / 10
              : null;

            await prisma.trainingData.create({
              data: {
                athleteId,
                date,
                sessionType: payload.sessionType,
                durationMin: Math.round(payload.durationMin),
                avgHeartRate: payload.avgHeartRate ? Math.round(payload.avgHeartRate) : null,
                maxHeartRate: payload.maxHeartRate ? Math.round(payload.maxHeartRate) : null,
                paceKmPerH: payload.paceKmPerH,
                distanceKm: payload.distanceKm,
                loadScore: Math.round(payload.loadScore),
                rpe: payload.rpe ? Math.round(payload.rpe) : null,
                source: payload.source || 'etl',
                rawDataId,
                etlRunId: this.logId,
              },
            });
            break;

          case 'strength':
            const est1Rm = payload.weightKg * (1 + payload.reps / 30);
            await prisma.strengthData.create({
              data: {
                athleteId,
                date,
                exercise: payload.exercise,
                weightKg: payload.weightKg,
                reps: Math.round(payload.reps),
                sets: Math.round(payload.sets),
                estimated1Rm: Math.round(est1Rm * 10) / 10,
                notes: payload.notes || null,
                rawDataId,
                etlRunId: this.logId,
              },
            });
            break;

          case 'recovery':
            await prisma.recoveryData.create({
              data: {
                athleteId,
                date,
                sleepScore: payload.sleepScore ? Math.round(payload.sleepScore) : null,
                hrv: payload.hrv ? Math.round(payload.hrv) : null,
                sorenessScore: payload.sorenessScore ? Math.round(payload.sorenessScore) : null,
                moodScore: payload.moodScore ? Math.round(payload.moodScore) : null,
                overallScore: Math.round(payload.overallScore),
                source: payload.source || 'etl',
                rawDataId,
                etlRunId: this.logId,
              },
            });
            break;

          case 'injury':
            await prisma.injuryRecord.create({
              data: {
                athleteId,
                date,
                injuryType: payload.injuryType,
                severity: payload.severity || 'medium',
                description: payload.description,
                notes: payload.notes || null,
                status: payload.status || 'active',
                returnDate: payload.returnDate ? new Date(payload.returnDate) : null,
                rawDataId,
                etlRunId: this.logId,
              },
            });
            break;
        }

        loaded++;
      } catch (e: any) {
        failed++;
        this.errors.push(`加载记录 ${record.id} 失败: ${e.message}`);

        await prisma.rawDataRecord.update({
          where: { id: record.id },
          data: {
            status: 'failed',
            error: e.message,
            processedAt: new Date(),
            etlRunId: this.logId,
          },
        });
      }
    }

    return { loaded, failed };
  }

  private async resolveAthlete(payload: any): Promise<string> {
    if (payload.athleteId) {
      const exists = await prisma.athlete.findUnique({
        where: { id: payload.athleteId },
      });
      if (exists) return payload.athleteId;
    }

    if (payload.athleteName) {
      const existing = await prisma.athlete.findFirst({
        where: { name: payload.athleteName },
      });
      if (existing) return existing.id;

      const newAthlete = await prisma.athlete.create({
        data: {
          name: payload.athleteName,
          sport: payload.sport || '未分类',
          team: payload.team || null,
        },
      });
      return newAthlete.id;
    }

    throw new Error('无法解析运动员信息');
  }

  private async markProcessed(records: any[]): Promise<void> {
    for (const record of records) {
      await prisma.rawDataRecord.update({
        where: { id: record.id },
        data: {
          status: 'processed',
          processedAt: new Date(),
          etlRunId: this.logId,
        },
      });
    }
  }

  static async importRawRecords(
    dataType: 'training' | 'strength' | 'recovery' | 'injury',
    records: any[],
    sourceName: string = 'api_import'
  ): Promise<{ imported: number; sourceId: string }> {
    let source = await prisma.rawDataSource.findFirst({
      where: { sourceName },
    });

    if (!source) {
      source = await prisma.rawDataSource.create({
        data: {
          sourceType: dataType,
          sourceName,
        },
      });
    }

    const rawRecords = records.map(r => ({
      sourceId: source!.id,
      dataType,
      payload: JSON.stringify(r),
    }));

    const result = await prisma.rawDataRecord.createMany({
      data: rawRecords,
    });

    return {
      imported: result.count,
      sourceId: source.id,
    };
  }

  static async getDataQualityStatus(): Promise<DataQualityStatus> {
    const lastEtl = await prisma.etlLog.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    const trainingCount = await prisma.trainingData.count();
    const strengthCount = await prisma.strengthData.count();
    const recoveryCount = await prisma.recoveryData.count();
    const injuryCount = await prisma.injuryRecord.count();
    const athleteCount = await prisma.athlete.count();

    const missingHeartRate = await prisma.trainingData.count({
      where: { avgHeartRate: null },
    });
    const missingPace = await prisma.trainingData.count({
      where: { AND: [{ sessionType: { contains: '有氧' } }, { paceKmPerH: null }] },
    });
    const missingSleep = await prisma.recoveryData.count({
      where: { sleepScore: null },
    });
    const missing1Rm = await prisma.strengthData.count({
      where: { estimated1Rm: null },
    });

    const pendingRaw = await prisma.rawDataRecord.count({
      where: { status: 'pending' },
    });
    const failedRaw = await prisma.rawDataRecord.count({
      where: { status: 'failed' },
    });

    const warnings: string[] = [];
    let status: DataQualityStatus['status'] = 'healthy';

    if (lastEtl?.status === 'failed') {
      status = 'error';
      warnings.push('最近一次ETL执行失败，请检查错误日志');
      if (lastEtl.errors) {
        warnings.push(...lastEtl.errors.split('\n').slice(0, 3));
      }
    }

    if (missingHeartRate > 0) {
      warnings.push(`${missingHeartRate} 条训练数据缺少心率记录`);
    }
    if (missingPace > 0) {
      warnings.push(`${missingPace} 条有氧训练缺少配速数据`);
    }
    if (missingSleep > 0) {
      warnings.push(`${missingSleep} 条恢复数据缺少睡眠评分`);
    }
    if (missing1Rm > 0) {
      warnings.push(`${missing1Rm} 条力量数据缺少1RM估算`);
    }
    if (pendingRaw > 0) {
      warnings.push(`${pendingRaw} 条原始数据等待处理`);
    }
    if (failedRaw > 0) {
      status = status === 'healthy' ? 'warning' : status;
      warnings.push(`${failedRaw} 条原始数据处理失败`);
    }

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const recentData = await prisma.trainingData.count({
      where: { date: { gte: threeDaysAgo } },
    });

    if (recentData === 0 && trainingCount > 0) {
      status = status === 'healthy' ? 'warning' : status;
      warnings.push('最近3天没有新数据录入');
    }

    if (trainingCount === 0) {
      status = 'warning';
      warnings.push('暂无训练数据，请先导入数据');
    }

    if (warnings.length > 0 && status === 'healthy') {
      status = 'warning';
    }

    const etlStatus = lastEtl
      ? (lastEtl.status as 'running' | 'completed' | 'failed' | 'unknown')
      : 'unknown';

    return {
      status,
      lastUpdated: lastEtl?.finishedAt || new Date(),
      warnings,
      sampleSizes: {
        training: trainingCount,
        strength: strengthCount,
        recovery: recoveryCount,
        injuries: injuryCount,
        athletes: athleteCount,
      },
      etlStatus,
      pendingRawRecords: pendingRaw,
      failedRawRecords: failedRaw,
      lastEtlError: lastEtl?.errors || undefined,
      missingFields: {
        trainingHeartRate: missingHeartRate,
        trainingPace: missingPace,
        recoverySleep: missingSleep,
        strength1Rm: missing1Rm,
      },
    };
  }
}
