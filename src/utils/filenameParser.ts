import * as crypto from 'crypto';

export interface ParsedFilename {
  callDate: string;
  callTime: string;
  agentId: string;
  agentName: string;
  duration?: number;
}

const AUDIO_FILENAME_PATTERNS = [
  /^(?<date>\d{8})_(?<time>\d{6})_(?<agentId>[A-Za-z0-9]+)_(?<agentName>[^_]+)_(?<duration>\d+)(?<suffix>_[a-zA-Z0-9]+)?\.(?<ext>mp3|wav|m4a)$/i,
  /^(?<date>\d{8})_(?<time>\d{6})_(?<agentId>[A-Za-z0-9]+)_(?<agentName>[^_]+)(?<suffix>_[a-zA-Z0-9]+)?\.(?<ext>mp3|wav|m4a)$/i,
  /^(?<agentId>[A-Za-z0-9]+)_(?<date>\d{8})_(?<time>\d{6})_(?<agentName>[^_]+)(?<suffix>_[a-zA-Z0-9]+)?\.(?<ext>mp3|wav|m4a)$/i,
];

const TRANSCRIPT_FILENAME_PATTERNS = [
  /^(?<date>\d{8})_(?<time>\d{6})_(?<agentId>[A-Za-z0-9]+)_(?<agentName>[^_]+)(?<suffix>_[a-zA-Z0-9]+)?\.(?<ext>txt|json|md)$/i,
  /^(?<agentId>[A-Za-z0-9]+)_(?<date>\d{8})_(?<time>\d{6})_(?<agentName>[^_]+)(?<suffix>_[a-zA-Z0-9]+)?\.(?<ext>txt|json|md)$/i,
];

export function parseAudioFilename(filename: string): ParsedFilename | null {
  for (const pattern of AUDIO_FILENAME_PATTERNS) {
    const match = filename.match(pattern);
    if (match && match.groups) {
      const { date, time, agentId, agentName, duration } = match.groups;
      return {
        callDate: formatDate(date),
        callTime: formatTime(time),
        agentId: agentId.toUpperCase(),
        agentName: agentName,
        duration: duration ? parseInt(duration, 10) : undefined,
      };
    }
  }
  return null;
}

export function parseTranscriptFilename(filename: string): ParsedFilename | null {
  for (const pattern of TRANSCRIPT_FILENAME_PATTERNS) {
    const match = filename.match(pattern);
    if (match && match.groups) {
      const { date, time, agentId, agentName } = match.groups;
      return {
        callDate: formatDate(date),
        callTime: formatTime(time),
        agentId: agentId.toUpperCase(),
        agentName: agentName,
      };
    }
  }
  return null;
}

function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
  return dateStr;
}

function formatTime(timeStr: string): string {
  if (timeStr.length === 6) {
    return `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:${timeStr.slice(4, 6)}`;
  }
  return timeStr;
}

export function generateAudioId(parsed: ParsedFilename): string {
  const raw = `${parsed.callDate}_${parsed.callTime}_${parsed.agentId}`;
  return crypto.createHash('md5').update(raw).digest('hex').slice(0, 16);
}

export function generateTranscriptMatchKey(parsed: ParsedFilename): string {
  return `${parsed.callDate}_${parsed.callTime}_${parsed.agentId}`;
}

export function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts[parts.length - 1].toLowerCase();
}
