export class AppError extends Error {
  public readonly code: string;
  public readonly cause?: Error;
  public readonly suggestions?: string[];
  public readonly location?: { file?: string; line?: number; column?: number };

  constructor(
    message: string,
    opts: {
      code?: string;
      cause?: Error;
      suggestions?: string[];
      location?: { file?: string; line?: number; column?: number };
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = opts.code || 'UNKNOWN_ERROR';
    this.cause = opts.cause;
    this.suggestions = opts.suggestions;
    this.location = opts.location;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toUserMessage(): string {
    const parts: string[] = [];
    parts.push(`❌ [${this.code}] ${this.message}`);

    if (this.location?.file) {
      const loc = this.location;
      if (loc.line !== undefined) {
        parts.push(`   📍 at ${loc.file}:${loc.line}${loc.column ? ':' + loc.column : ''}`);
      } else {
        parts.push(`   📍 in ${loc.file}`);
      }
    }

    if (this.suggestions && this.suggestions.length > 0) {
      parts.push('   💡 建议:');
      this.suggestions.forEach((s, i) => {
        parts.push(`      ${i + 1}. ${s}`);
      });
    }

    if (this.cause) {
      parts.push(`   🔗 原因: ${this.cause.message}`);
    }

    return parts.join('\n');
  }
}

export class ConfigError extends AppError {
  constructor(message: string, opts: Partial<ConstructorParameters<typeof AppError>[1]> = {}) {
    super(message, { code: opts.code || 'CONFIG_ERROR', ...opts });
    this.name = 'ConfigError';
  }
}

export class RequestError extends AppError {
  constructor(message: string, opts: Partial<ConstructorParameters<typeof AppError>[1]> = {}) {
    super(message, { code: opts.code || 'REQUEST_ERROR', ...opts });
    this.name = 'RequestError';
  }
}

export class AssertionError extends AppError {
  constructor(message: string, opts: Partial<ConstructorParameters<typeof AppError>[1]> = {}) {
    super(message, { code: opts.code || 'ASSERTION_ERROR', ...opts });
    this.name = 'AssertionError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, opts: Partial<ConstructorParameters<typeof AppError>[1]> = {}) {
    super(message, { code: opts.code || 'VALIDATION_ERROR', ...opts });
    this.name = 'ValidationError';
  }
}
