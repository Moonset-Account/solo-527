import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { AudioFile, TranscriptFile, ParseResult } from '../types';
import {
  parseAudioFilename,
  parseTranscriptFilename,
  generateAudioId,
  getExtension,
} from './filenameParser';

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.wma', '.ogg'];
const TRANSCRIPT_EXTENSIONS = ['.txt', '.json', '.md'];

export function scanAudioDirectory(dirPath: string): ParseResult<AudioFile[]> {
  const errors: string[] = [];
  const audioFiles: AudioFile[] = [];

  if (!fs.existsSync(dirPath)) {
    errors.push(`录音目录不存在: ${dirPath}`);
    return { data: [], errors };
  }

  try {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const ext = path.extname(file).toLowerCase();

      if (!AUDIO_EXTENSIONS.includes(ext)) {
        continue;
      }

      try {
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) continue;

        const parsed = parseAudioFilename(file);
        if (!parsed) {
          errors.push(`无法解析文件名格式: ${file}`);
          continue;
        }

        const duration = parsed.duration || estimateDuration(stats.size);

        audioFiles.push({
          id: generateAudioId(parsed),
          fileName: file,
          filePath,
          fileSize: stats.size,
          duration,
          callDate: parsed.callDate,
          callTime: parsed.callTime,
          agentId: parsed.agentId,
          agentName: parsed.agentName,
          extension: ext.slice(1),
        });
      } catch (err) {
        if (err instanceof Error) {
          errors.push(`处理文件 ${file} 失败: ${err.message}`);
        }
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      errors.push(`扫描目录失败: ${err.message}`);
    }
  }

  return { data: audioFiles, errors };
}

export function scanTranscriptDirectory(dirPath: string): ParseResult<TranscriptFile[]> {
  const errors: string[] = [];
  const transcriptFiles: TranscriptFile[] = [];

  if (!fs.existsSync(dirPath)) {
    errors.push(`转写目录不存在: ${dirPath}`);
    return { data: [], errors };
  }

  try {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const ext = path.extname(file).toLowerCase();

      if (!TRANSCRIPT_EXTENSIONS.includes(ext)) {
        continue;
      }

      try {
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) continue;

        const parsed = parseTranscriptFilename(file);
        if (!parsed) {
          errors.push(`无法解析转写文件名格式: ${file}`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const duration = extractDurationFromContent(content);

        transcriptFiles.push({
          id: generateAudioId(parsed),
          fileName: file,
          filePath,
          content,
          callDate: parsed.callDate,
          callTime: parsed.callTime,
          agentId: parsed.agentId,
          duration,
        });
      } catch (err) {
        if (err instanceof Error) {
          errors.push(`处理转写文件 ${file} 失败: ${err.message}`);
        }
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      errors.push(`扫描转写目录失败: ${err.message}`);
    }
  }

  return { data: transcriptFiles, errors };
}

function estimateDuration(fileSize: number): number {
  const avgBitrate = 128000;
  return Math.round((fileSize * 8) / avgBitrate);
}

function extractDurationFromContent(content: string): number | undefined {
  const durationMatch = content.match(/(?:时长|duration)\s*[:：]\s*(\d+)\s*(?:秒|s)?/i);
  if (durationMatch) {
    return parseInt(durationMatch[1], 10);
  }

  const timeMatch = content.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return undefined;
}

export function calculateChecksum(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

export function calculateDirectoryChecksum(files: string[]): string {
  const hash = crypto.createHash('md5');
  files.sort().forEach(file => hash.update(file));
  return hash.digest('hex');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
