export const DEV_MODE: boolean = import.meta.env.DEV;

type LogFn = (...args: unknown[]) => void;

export interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

export function createLogger(tag: string): Logger {
  const prefix = `[${tag}]`;

  const debug: LogFn = (...args) => {
    if (DEV_MODE) {
      console.debug(prefix, ...args);
    }
  };

  const info: LogFn = (...args) => {
    if (DEV_MODE) {
      console.info(prefix, ...args);
    }
  };

  const warn: LogFn = (...args) => {
    console.warn(prefix, ...args);
  };

  const error: LogFn = (...args) => {
    console.error(prefix, ...args);
  };

  return { debug, info, warn, error };
}
