import dayjs from 'dayjs';
import * as crypto from 'crypto';
import {
  AudioFile,
  TranscriptFile,
  ScheduleEntry,
  IndexEntry,
  IndexReport,
  AnomalyType,
  Anomaly,
  InputSummary,
  CliOptions,
} from '../types';
import { Validator, ValidationContext } from './validator';
import { calculateDirectoryChecksum } from '../utils/fileScanner';

export interface GeneratorContext {
  audioFiles: AudioFile[];
  transcriptFiles: TranscriptFile[];
  scheduleEntries: ScheduleEntry[];
  options: CliOptions;
}

export class IndexGenerator {
  private context: GeneratorContext;
  private validator: Validator;

  constructor(context: GeneratorContext) {
    this.context = context;
    const validationContext: ValidationContext = {
      audioFiles: context.audioFiles,
      transcriptFiles: context.transcriptFiles,
      scheduleEntries: context.scheduleEntries,
      options: context.options,
    };
    this.validator = new Validator(validationContext);
  }

  public generate(): IndexReport {
    const indices = this.buildIndices();
    const anomalies = this.collectAnomalies(indices);
    const inputSummary = this.buildInputSummary();
    const summary = this.buildSummary(indices, anomalies);

    return {
      summary,
      indices,
      anomalies,
      inputSummary,
    };
  }

  private buildIndices(): IndexEntry[] {
    const { audioFiles, options } = this.context;
    const indices: IndexEntry[] = [];

    const filteredAudios = audioFiles.filter(audio => {
      if (options.agent && audio.agentId.toLowerCase() !== options.agent.toLowerCase()) {
        return false;
      }
      if (options.date && audio.callDate !== options.date) {
        return false;
      }
      return true;
    });

    const processedIds = new Set<string>();

    for (const audio of filteredAudios) {
      if (processedIds.has(audio.id)) continue;
      processedIds.add(audio.id);

      const anomalies = this.validator.validate(audio);
      const transcript = this.validator.getTranscript(audio.id, audio);
      const hasCriticalAnomaly = anomalies.some(a => a.severity === 'critical');

      indices.push({
        audioId: audio.id,
        audioFile: audio.filePath,
        transcriptFile: transcript?.filePath,
        callDate: audio.callDate,
        callTime: audio.callTime,
        agentId: audio.agentId,
        agentName: audio.agentName,
        duration: audio.duration,
        anomalies,
        isValid: !hasCriticalAnomaly,
      });
    }

    return indices.sort((a, b) => {
      if (a.callDate !== b.callDate) {
        return a.callDate.localeCompare(b.callDate);
      }
      if (a.agentId !== b.agentId) {
        return a.agentId.localeCompare(b.agentId);
      }
      return a.callTime.localeCompare(b.callTime);
    });
  }

  private collectAnomalies(indices: IndexEntry[]): Anomaly[] {
    const allAnomalies: Anomaly[] = [];
    for (const index of indices) {
      allAnomalies.push(...index.anomalies);
    }
    return allAnomalies;
  }

  private buildSummary(indices: IndexEntry[], anomalies: Anomaly[]) {
    const { audioFiles, transcriptFiles } = this.context;

    const validSamples = indices.filter(i => i.isValid).length;

    const anomaliesByType: Record<AnomalyType, number> = {
      [AnomalyType.MISSING_TRANSCRIPT]: 0,
      [AnomalyType.AGENT_MISMATCH]: 0,
      [AnomalyType.DURATION_ABNORMAL]: 0,
      [AnomalyType.DUPLICATE_SAMPLE]: 0,
      [AnomalyType.AGENT_NOT_SCHEDULED]: 0,
    };

    for (const anomaly of anomalies) {
      anomaliesByType[anomaly.type]++;
    }

    const agents = [...new Set(indices.map(i => i.agentId))].sort();

    const dates = indices.map(i => i.callDate).sort();
    const dateRange = {
      start: dates[0] || '',
      end: dates[dates.length - 1] || '',
    };

    return {
      totalAudio: audioFiles.length,
      totalTranscript: transcriptFiles.length,
      validSamples,
      totalAnomalies: anomalies.length,
      anomaliesByType,
      agents,
      dateRange,
    };
  }

  private buildInputSummary(): InputSummary {
    const { audioFiles, transcriptFiles, scheduleEntries, options } = this.context;

    const checksumData = [
      ...audioFiles.map(a => `${a.fileName}:${a.fileSize}`),
      ...transcriptFiles.map(t => `${t.fileName}:${t.content.length}`),
      scheduleEntries.length.toString(),
      options.agent || '',
      options.date || '',
    ].join('|');

    const checksum = crypto.createHash('md5').update(checksumData).digest('hex');

    return {
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      audioDir: options.audioDir,
      transcriptDir: options.transcriptDir,
      scheduleFile: options.scheduleFile,
      audioCount: audioFiles.length,
      transcriptCount: transcriptFiles.length,
      scheduleCount: scheduleEntries.length,
      audioFiles: audioFiles.map(a => a.fileName),
      transcriptFiles: transcriptFiles.map(t => t.fileName),
      options: {
        agent: options.agent,
        date: options.date,
        minDuration: options.minDuration,
        maxDuration: options.maxDuration,
      },
      checksum,
    };
  }

  public hasCriticalAnomalies(report: IndexReport): boolean {
    return report.anomalies.some(a => a.severity === 'critical');
  }

  public getCriticalAnomalyCount(report: IndexReport): number {
    return report.anomalies.filter(a => a.severity === 'critical').length;
  }
}
