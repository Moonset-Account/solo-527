import dayjs from 'dayjs';
import {
  AudioFile,
  TranscriptFile,
  ScheduleEntry,
  Anomaly,
  AnomalyType,
  CliOptions,
} from '../types';

export interface ValidationContext {
  audioFiles: AudioFile[];
  transcriptFiles: TranscriptFile[];
  scheduleEntries: ScheduleEntry[];
  options: CliOptions;
}

export class Validator {
  private context: ValidationContext;
  private transcriptMap: Map<string, TranscriptFile>;
  private transcriptByDateTime: Map<string, TranscriptFile>;
  private scheduleMap: Map<string, ScheduleEntry[]>;

  constructor(context: ValidationContext) {
    this.context = context;
    this.transcriptMap = this.buildTranscriptMap();
    this.transcriptByDateTime = this.buildTranscriptByDateTimeMap();
    this.scheduleMap = this.buildScheduleMap();
  }

  public validate(audio: AudioFile): Anomaly[] {
    const anomalies: Anomaly[] = [];

    anomalies.push(...this.checkMissingTranscript(audio));
    anomalies.push(...this.checkAgentMismatch(audio));
    anomalies.push(...this.checkDurationAbnormal(audio));
    anomalies.push(...this.checkDuplicateSample(audio));
    anomalies.push(...this.checkAgentNotScheduled(audio));

    return anomalies;
  }

  public validateAll(): Map<string, Anomaly[]> {
    const results = new Map<string, Anomaly[]>();
    const filteredAudios = this.filterByOptions(this.context.audioFiles);

    for (const audio of filteredAudios) {
      const anomalies = this.validate(audio);
      if (anomalies.length > 0) {
        results.set(audio.id, anomalies);
      }
    }

    return results;
  }

  private checkMissingTranscript(audio: AudioFile): Anomaly[] {
    const anomalies: Anomaly[] = [];
    let transcript = this.transcriptMap.get(audio.id);

    if (!transcript) {
      const dateTimeKey = `${audio.callDate}_${audio.callTime}`;
      transcript = this.transcriptByDateTime.get(dateTimeKey);

      if (transcript && transcript.agentId !== audio.agentId) {
        anomalies.push({
          type: AnomalyType.AGENT_MISMATCH,
          severity: 'warning',
          audioId: audio.id,
          message: `录音坐席ID与转写坐席ID不匹配（通过通话时间匹配到转写）`,
          details: {
            audioAgentId: audio.agentId,
            transcriptAgentId: transcript.agentId,
            audioFile: audio.fileName,
            transcriptFile: transcript.fileName,
            callDateTime: `${audio.callDate} ${audio.callTime}`,
          },
        });
        return anomalies;
      }

      anomalies.push({
        type: AnomalyType.MISSING_TRANSCRIPT,
        severity: 'critical',
        audioId: audio.id,
        message: `录音文件缺少对应的转写文本`,
        details: {
          audioFile: audio.fileName,
          expectedTranscriptPattern: this.getExpectedTranscriptName(audio),
        },
      });
    }

    return anomalies;
  }

  private checkAgentMismatch(audio: AudioFile): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const transcript = this.transcriptMap.get(audio.id);

    if (!transcript) return anomalies;

    if (audio.agentId !== transcript.agentId) {
      anomalies.push({
        type: AnomalyType.AGENT_MISMATCH,
        severity: 'warning',
        audioId: audio.id,
        message: `录音坐席ID与转写坐席ID不匹配`,
        details: {
          audioAgentId: audio.agentId,
          transcriptAgentId: transcript.agentId,
          audioFile: audio.fileName,
          transcriptFile: transcript.fileName,
        },
      });
    }

    return anomalies;
  }

  private checkDurationAbnormal(audio: AudioFile): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const { minDuration, maxDuration } = this.context.options;
    const transcript = this.transcriptMap.get(audio.id);

    if (audio.duration < minDuration || audio.duration > maxDuration) {
      anomalies.push({
        type: AnomalyType.DURATION_ABNORMAL,
        severity: 'warning',
        audioId: audio.id,
        message: `录音时长超出正常范围 [${minDuration}s, ${maxDuration}s]`,
        details: {
          actualDuration: audio.duration,
          minDuration,
          maxDuration,
          audioFile: audio.fileName,
        },
      });
    }

    if (transcript && transcript.duration) {
      const durationDiff = Math.abs(audio.duration - transcript.duration);
      const diffThreshold = Math.max(10, audio.duration * 0.1);

      if (durationDiff > diffThreshold) {
        anomalies.push({
          type: AnomalyType.DURATION_ABNORMAL,
          severity: 'info',
          audioId: audio.id,
          message: `录音时长与转写记录时长差异较大`,
          details: {
            audioDuration: audio.duration,
            transcriptDuration: transcript.duration,
            difference: durationDiff,
            audioFile: audio.fileName,
            transcriptFile: transcript.fileName,
          },
        });
      }
    }

    return anomalies;
  }

  private checkDuplicateSample(audio: AudioFile): Anomaly[] {
    const anomalies: Anomaly[] = [];

    const duplicates = this.context.audioFiles.filter(a => {
      if (a.filePath === audio.filePath) return false;
      return (
        a.callDate === audio.callDate &&
        a.callTime === audio.callTime &&
        a.agentId === audio.agentId
      );
    });

    if (duplicates.length > 0) {
      anomalies.push({
        type: AnomalyType.DUPLICATE_SAMPLE,
        severity: 'warning',
        audioId: audio.id,
        message: `检测到重复样本，共 ${duplicates.length + 1} 个相同通话记录`,
        details: {
          duplicateCount: duplicates.length + 1,
          duplicateFiles: [audio.fileName, ...duplicates.map(d => d.fileName)],
          callDateTime: `${audio.callDate} ${audio.callTime}`,
          agentId: audio.agentId,
        },
      });
    }

    return anomalies;
  }

  private checkAgentNotScheduled(audio: AudioFile): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const scheduleKey = `${audio.callDate}_${audio.agentId}`;
    const schedules = this.scheduleMap.get(scheduleKey) || [];

    if (schedules.length === 0) {
      anomalies.push({
        type: AnomalyType.AGENT_NOT_SCHEDULED,
        severity: 'warning',
        audioId: audio.id,
        message: `该坐席在通话日期没有排班记录`,
        details: {
          agentId: audio.agentId,
          agentName: audio.agentName,
          callDate: audio.callDate,
          callTime: audio.callTime,
          audioFile: audio.fileName,
        },
      });
    } else {
      const callDateTime = dayjs(`${audio.callDate} ${audio.callTime}`);
      const isInShift = schedules.some(schedule => {
        const shiftStart = dayjs(`${audio.callDate} ${schedule.shiftStart}`);
        const shiftEnd = dayjs(`${audio.callDate} ${schedule.shiftEnd}`);
        return (callDateTime.isSame(shiftStart) || callDateTime.isAfter(shiftStart)) &&
               (callDateTime.isSame(shiftEnd) || callDateTime.isBefore(shiftEnd));
      });

      if (!isInShift) {
        anomalies.push({
          type: AnomalyType.AGENT_NOT_SCHEDULED,
          severity: 'info',
          audioId: audio.id,
          message: `通话时间不在坐席排班时段内`,
          details: {
            agentId: audio.agentId,
            agentName: audio.agentName,
            callDateTime: `${audio.callDate} ${audio.callTime}`,
            scheduledShifts: schedules.map(s => `${s.shiftStart}-${s.shiftEnd}`),
            audioFile: audio.fileName,
          },
        });
      }
    }

    return anomalies;
  }

  private buildTranscriptMap(): Map<string, TranscriptFile> {
    const map = new Map<string, TranscriptFile>();
    for (const transcript of this.context.transcriptFiles) {
      map.set(transcript.id, transcript);
    }
    return map;
  }

  private buildTranscriptByDateTimeMap(): Map<string, TranscriptFile> {
    const map = new Map<string, TranscriptFile>();
    for (const transcript of this.context.transcriptFiles) {
      const key = `${transcript.callDate}_${transcript.callTime}`;
      map.set(key, transcript);
    }
    return map;
  }

  private buildScheduleMap(): Map<string, ScheduleEntry[]> {
    const map = new Map<string, ScheduleEntry[]>();
    for (const schedule of this.context.scheduleEntries) {
      const key = `${schedule.date}_${schedule.agentId}`;
      const existing = map.get(key) || [];
      existing.push(schedule);
      map.set(key, existing);
    }
    return map;
  }

  private filterByOptions(audios: AudioFile[]): AudioFile[] {
    const { agent, date } = this.context.options;
    return audios.filter(audio => {
      if (agent && audio.agentId.toLowerCase() !== agent.toLowerCase()) {
        return false;
      }
      if (date && audio.callDate !== date) {
        return false;
      }
      return true;
    });
  }

  private getExpectedTranscriptName(audio: AudioFile): string {
    return `${audio.callDate.replace(/-/g, '')}_${audio.callTime.replace(/:/g, '')}_${audio.agentId}_${audio.agentName}.txt`;
  }

  public getTranscript(audioId: string, audio?: AudioFile): TranscriptFile | undefined {
    let transcript = this.transcriptMap.get(audioId);
    if (!transcript && audio) {
      const dateTimeKey = `${audio.callDate}_${audio.callTime}`;
      transcript = this.transcriptByDateTime.get(dateTimeKey);
    }
    return transcript;
  }
}
