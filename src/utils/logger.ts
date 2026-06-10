import chalk from 'chalk';
import { LogLevel } from '../types';

type LogLevelType = LogLevel['level'];

const LEVELS: Record<LogLevelType, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  verbose: 5,
};

class Logger {
  private level: LogLevelType = 'info';
  private noColor: boolean = false;

  setLevel(level: LogLevelType): void {
    this.level = level;
  }

  setNoColor(noColor: boolean): void {
    this.noColor = noColor;
    if (noColor) {
      chalk.level = 0;
    }
  }

  private shouldLog(level: LogLevelType): boolean {
    return LEVELS[level] <= LEVELS[this.level];
  }

  private formatTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  error(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('error')) return;
    const prefix = this.noColor ? '[ERROR]' : chalk.red('[ERROR]');
    const ts = chalk.gray(this.formatTimestamp());
    console.error(`${ts} ${prefix} ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('warn')) return;
    const prefix = this.noColor ? '[WARN]' : chalk.yellow('[WARN]');
    const ts = chalk.gray(this.formatTimestamp());
    console.warn(`${ts} ${prefix} ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('info')) return;
    const prefix = this.noColor ? '[INFO]' : chalk.blue('[INFO]');
    const ts = chalk.gray(this.formatTimestamp());
    console.log(`${ts} ${prefix} ${message}`, ...args);
  }

  success(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('info')) return;
    const prefix = this.noColor ? '[PASS]' : chalk.green('[PASS]');
    const ts = chalk.gray(this.formatTimestamp());
    console.log(`${ts} ${prefix} ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('debug')) return;
    const prefix = this.noColor ? '[DEBUG]' : chalk.gray('[DEBUG]');
    const ts = chalk.gray(this.formatTimestamp());
    console.log(`${ts} ${prefix} ${message}`, ...args);
  }

  verbose(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('verbose')) return;
    const prefix = this.noColor ? '[VERBOSE]' : chalk.magenta('[VERBOSE]');
    const ts = chalk.gray(this.formatTimestamp());
    console.log(`${ts} ${prefix} ${message}`, ...args);
  }

  newline(): void {
    if (this.shouldLog('info')) {
      console.log('');
    }
  }

  raw(message: string): void {
    if (this.shouldLog('info')) {
      console.log(message);
    }
  }
}

export const logger = new Logger();
