class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toLowerCase() : 'info';
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
  }

  _shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  _format(level, args) {
    const ts = new Date().toISOString();
    const msg = args.map(a => {
      if (a instanceof Error) return `[${a.name}] ${a.message}\n${a.stack || ''}`;
      if (typeof a === 'object') return JSON.stringify(a, null, 0);
      return String(a);
    }).join(' ');
    return `[${ts}] [${level.toUpperCase()}] ${msg}`;
  }

  error(...args) { if (this._shouldLog('error')) console.error(this._format('error', args)); }
  warn(...args)  { if (this._shouldLog('warn'))  console.warn(this._format('warn', args)); }
  info(...args)  { if (this._shouldLog('info'))  console.info(this._format('info', args)); }
  debug(...args) { if (this._shouldLog('debug')) console.log(this._format('debug', args)); }
}

module.exports = new Logger();
