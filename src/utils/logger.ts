type LogMethod = (message: string, ...args: unknown[]) => void;

export interface Logger {
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

const COLORS = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
} as const;

function formatTimestamp(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function createLogger(prefix: string): Logger {
  const formatMessage = (
    level: string,
    color: string,
    message: string
  ): string => {
    const timestamp = `${COLORS.gray}${formatTimestamp()}${COLORS.reset}`;
    const levelTag = `${color}[${level}]${COLORS.reset}`;
    const prefixTag = `${COLORS.cyan}[${prefix}]${COLORS.reset}`;
    return `${timestamp} ${levelTag} ${prefixTag} ${message}`;
  };

  return {
    info: (message: string, ...args: unknown[]) => {
      console.log(formatMessage("INFO", COLORS.cyan, message), ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(formatMessage("WARN", COLORS.yellow, message), ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(formatMessage("ERROR", COLORS.red, message), ...args);
    },
  };
}
