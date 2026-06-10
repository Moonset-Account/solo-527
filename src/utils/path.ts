import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export const PathUtils = {
  normalize(inputPath: string): string {
    if (!inputPath) return inputPath;
    const normalized = inputPath.replace(/[\\/]+/g, path.sep);
    return path.normalize(normalized);
  },

  toPosix(inputPath: string): string {
    if (!inputPath) return inputPath;
    return inputPath.split(path.sep).join('/').split('\\').join('/');
  },

  resolve(...paths: string[]): string {
    return path.resolve(...paths.map(p => this.normalize(p)));
  },

  relative(from: string, to: string): string {
    return path.relative(this.normalize(from), this.normalize(to));
  },

  isAbsolute(inputPath: string): boolean {
    return path.isAbsolute(this.normalize(inputPath));
  },

  dirname(inputPath: string): string {
    return path.dirname(this.normalize(inputPath));
  },

  basename(inputPath: string, ext?: string): string {
    return path.basename(this.normalize(inputPath), ext);
  },

  extname(inputPath: string): string {
    return path.extname(this.normalize(inputPath));
  },

  join(...paths: string[]): string {
    return path.join(...paths.map(p => this.normalize(p)));
  },

  expandHome(inputPath: string): string {
    if (!inputPath) return inputPath;
    if (inputPath === '~' || inputPath.startsWith('~/')) {
      return inputPath.replace('~', os.homedir());
    }
    if (inputPath.startsWith('$HOME')) {
      return inputPath.replace('$HOME', os.homedir());
    }
    return inputPath;
  },

  expandEnv(inputPath: string): string {
    if (!inputPath) return inputPath;
    return inputPath.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, name) => {
      return process.env[name] || '';
    }).replace(/%([A-Za-z_][A-Za-z0-9_]*)%/g, (_, name) => {
      return process.env[name] || '';
    });
  },

  expandPath(inputPath: string): string {
    return this.normalize(this.expandEnv(this.expandHome(inputPath)));
  },

  makeAbsolute(inputPath: string, baseDir?: string): string {
    const expanded = this.expandPath(inputPath);
    if (this.isAbsolute(expanded)) {
      return expanded;
    }
    const base = baseDir || process.cwd();
    return this.resolve(base, expanded);
  },

  ensureDir(dirPath: string): string {
    const absPath = this.makeAbsolute(dirPath);
    if (!fs.existsSync(absPath)) {
      fs.mkdirSync(absPath, { recursive: true });
    }
    return absPath;
  },

  exists(inputPath: string): boolean {
    try {
      return fs.existsSync(this.makeAbsolute(inputPath));
    } catch {
      return false;
    }
  },

  safeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_\-.]/g, '_');
  },

  tempDir(): string {
    return os.tmpdir();
  },

  tempFile(prefix: string = 'tmp', suffix: string = ''): string {
    const rand = Math.random().toString(36).substring(2, 8);
    return this.join(this.tempDir(), `${prefix}_${Date.now()}_${rand}${suffix}`);
  },
};
