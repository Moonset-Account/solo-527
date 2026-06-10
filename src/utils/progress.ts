import { write, cursor, erase } from './tty';

export type ProgressStage =
  | 'scanning'
  | 'analyzing'
  | 'hashing'
  | 'referencing'
  | 'reporting'
  | 'done';

export interface ProgressState {
  stage: ProgressStage;
  stageLabel: string;
  current: number;
  total: number;
  message: string;
  startTime: number;
}

const STAGE_LABELS: Record<ProgressStage, string> = {
  scanning: '扫描目录',
  analyzing: '分析图片',
  hashing: '计算哈希',
  referencing: '解析引用',
  reporting: '生成报告',
  done: '完成',
};

export class ProgressBar {
  private enabled: boolean;
  private state: ProgressState;
  private stream: NodeJS.WritableStream;
  private interval: ReturnType<typeof setInterval> | null = null;
  private lastRender = 0;
  private spinnerFrame = 0;
  private readonly spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  constructor(enabled: boolean = true, stream?: NodeJS.WritableStream) {
    const useStream = stream ?? process.stdout;
    this.enabled = enabled && (useStream as any).isTTY !== false;
    this.stream = useStream;
    this.state = {
      stage: 'scanning',
      stageLabel: STAGE_LABELS.scanning,
      current: 0,
      total: 0,
      message: '',
      startTime: Date.now(),
    };
  }

  start(): void {
    if (!this.enabled) return;
    this.state.startTime = Date.now();
    this.interval = setInterval(() => {
      this.spinnerFrame = (this.spinnerFrame + 1) % this.spinnerChars.length;
      this.render();
    }, 80);
    this.render();
  }

  setStage(stage: ProgressStage, total?: number, message?: string): void {
    this.state.stage = stage;
    this.state.stageLabel = STAGE_LABELS[stage];
    this.state.current = 0;
    if (total !== undefined) this.state.total = total;
    if (message !== undefined) this.state.message = message;
    if (this.enabled) this.render();
  }

  tick(message?: string, increment: number = 1): void {
    this.state.current = Math.min(this.state.current + increment, this.state.total || this.state.current + increment);
    if (message !== undefined) this.state.message = message;
    if (this.enabled) this.render();
  }

  setCurrent(current: number, message?: string): void {
    this.state.current = current;
    if (message !== undefined) this.state.message = message;
    if (this.enabled) this.render();
  }

  log(line: string): void {
    if (this.enabled) {
      this.clearLine();
    }
    this.stream.write(line + '\n');
    if (this.enabled) {
      this.render();
    }
  }

  private clearLine(): void {
    if (process.stdout.isTTY) {
      cursor.toColumn(0);
      erase.line();
    } else {
      this.stream.write('\r');
    }
  }

  private render(): void {
    const now = Date.now();
    if (now - this.lastRender < 60 && this.state.stage !== 'done') return;
    this.lastRender = now;

    const { stageLabel, current, total, message } = this.state;
    const spinner = this.spinnerChars[this.spinnerFrame];
    const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    const barWidth = 24;
    const filled = total > 0 ? Math.round((current / total) * barWidth) : 0;
    const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
    const counter = total > 0 ? `${current}/${total}` : `${current}`;

    const output = ` ${spinner} ${stageLabel} [${bar}] ${pct.toString().padStart(3)}% (${counter}) ${message}`.slice(
      0,
      process.stdout.columns ?? 120,
    );

    this.clearLine();
    this.stream.write(output);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.state.stage = 'done';
    this.state.stageLabel = STAGE_LABELS.done;
    if (this.enabled) {
      this.render();
      this.stream.write('\n');
    }
  }

  finish(finalMessage?: string): void {
    if (this.enabled) {
      const elapsed = ((Date.now() - this.state.startTime) / 1000).toFixed(2);
      this.clearLine();
      const msg = finalMessage ?? `完成，用时 ${elapsed}s`;
      this.stream.write(` ✅ ${msg}\n`);
    }
    this.stop();
  }
}

export function createProgress(enabled: boolean, stream?: NodeJS.WritableStream): ProgressBar {
  return new ProgressBar(enabled, stream);
}
