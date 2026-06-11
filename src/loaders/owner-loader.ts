import * as fs from 'fs';
import * as path from 'path';
import type { OwnerConfig, OwnerConfigEntry } from '../types';
import { matchesPattern } from '../utils';

export interface OwnerLoaderOptions {
  ownerFile?: string;
}

export class OwnerLoader {
  private options: OwnerLoaderOptions;

  constructor(options: OwnerLoaderOptions = {}) {
    this.options = options;
  }

  async load(): Promise<OwnerConfig> {
    if (!this.options.ownerFile) {
      return { owners: [] };
    }

    const resolvedPath = path.resolve(this.options.ownerFile);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Owner config file not found: ${resolvedPath}`);
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const content = fs.readFileSync(resolvedPath, 'utf-8');

    try {
      let data: OwnerConfig | Partial<OwnerConfig>;

      if (ext === '.json') {
        data = JSON.parse(content) as OwnerConfig;
      } else if (ext === '.yaml' || ext === '.yml') {
        data = this.parseYaml(content) as OwnerConfig;
      } else {
        try {
          data = JSON.parse(content) as OwnerConfig;
        } catch {
          data = this.parseYaml(content) as OwnerConfig;
        }
      }

      return this.normalizeConfig(data);
    } catch (err) {
      throw new Error(`Failed to parse owner config: ${(err as Error).message}`);
    }
  }

  resolveOwner(flagKey: string, config: OwnerConfig, annotatedOwner?: string): string | undefined {
    if (annotatedOwner) return annotatedOwner;

    for (const entry of config.owners) {
      if (matchesPattern(flagKey, entry.pattern)) {
        return entry.owner;
      }
    }

    return config.defaultOwner;
  }

  private normalizeConfig(data: Partial<OwnerConfig>): OwnerConfig {
    const owners: OwnerConfigEntry[] = [];

    if (Array.isArray(data.owners)) {
      for (const entry of data.owners) {
        if (entry && typeof entry === 'object' && 'pattern' in entry && 'owner' in entry) {
          owners.push({
            pattern: String(entry.pattern),
            owner: String(entry.owner),
            description: entry.description ? String(entry.description) : undefined,
          });
        }
      }
    }

    const dataWithRules = data as Partial<OwnerConfig> & { ownerRules?: OwnerConfigEntry[] };
    if (dataWithRules.ownerRules && Array.isArray(dataWithRules.ownerRules)) {
      for (const entry of dataWithRules.ownerRules) {
        if (entry && typeof entry === 'object' && 'pattern' in entry && 'owner' in entry) {
          owners.push({
            pattern: String(entry.pattern),
            owner: String(entry.owner),
            description: entry.description ? String(entry.description) : undefined,
          });
        }
      }
    }

    return {
      owners,
      defaultOwner: data.defaultOwner ? String(data.defaultOwner) : undefined,
    };
  }

  private parseYaml(content: string): Partial<OwnerConfig> {
    const result: Partial<OwnerConfig> = {};
    const lines = content.split('\n');
    let currentSection: 'owners' | null = null;
    const owners: OwnerConfigEntry[] = [];
    let currentEntry: Partial<OwnerConfigEntry> | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      if (line === 'owners:' || line === 'ownerRules:') {
        currentSection = 'owners';
        continue;
      }

      if (line.startsWith('defaultOwner:')) {
        result.defaultOwner = line.split(':')[1].trim().replace(/^['"]|['"]$/g, '');
        continue;
      }

      if (currentSection === 'owners') {
        if (line.startsWith('- ')) {
          if (currentEntry && currentEntry.pattern && currentEntry.owner) {
            owners.push(currentEntry as OwnerConfigEntry);
          }
          const remainder = line.slice(2).trim();
          currentEntry = {};

          const patternMatch = remainder.match(/pattern[:\s]+['"]?([^'"]+)/);
          const ownerMatch = remainder.match(/owner[:\s]+['"]?([^'"\s,}]+)/);
          const descMatch = remainder.match(/description[:\s]+['"]?([^'"}]+)/);

          if (patternMatch) currentEntry.pattern = patternMatch[1];
          if (ownerMatch) currentEntry.owner = ownerMatch[1];
          if (descMatch) currentEntry.description = descMatch[1].trim();
        } else if (currentEntry) {
          const patternMatch = line.match(/pattern[:\s]+['"]?([^'"]+)/);
          const ownerMatch = line.match(/owner[:\s]+['"]?([^'"\s,}]+)/);
          const descMatch = line.match(/description[:\s]+['"]?([^'"}]+)/);

          if (patternMatch) currentEntry.pattern = patternMatch[1];
          if (ownerMatch) currentEntry.owner = ownerMatch[1];
          if (descMatch) currentEntry.description = descMatch[1].trim();
        }
      }
    }

    if (currentEntry && currentEntry.pattern && currentEntry.owner) {
      owners.push(currentEntry as OwnerConfigEntry);
    }

    if (owners.length > 0) {
      result.owners = owners;
    }

    return result;
  }
}
