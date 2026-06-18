export class DateUtils {
  static formatDate(value: any, format: string = 'yyyy-MM-dd'): string | null {
    if (!value) return null;

    try {
      let date: Date;
      if (value instanceof Date) {
        date = value;
      } else if (typeof value === 'string' || typeof value === 'number') {
        date = new Date(value);
      } else if (typeof value.toDate === 'function') {
        date = value.toDate();
      } else if (typeof value.format === 'function') {
        return value.format(this.toMomentFormat(format));
      } else {
        date = new Date(String(value));
      }

      if (isNaN(date.getTime())) return null;

      return this.formatDateNative(date, format);
    } catch {
      return null;
    }
  }

  static toISOString(value: any): string | null {
    if (!value) return null;

    try {
      let date: Date;
      if (value instanceof Date) {
        date = value;
      } else if (typeof value.toDate === 'function') {
        date = value.toDate();
      } else if (typeof value === 'string' || typeof value === 'number') {
        date = new Date(value);
      } else {
        date = new Date(String(value));
      }
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  }

  static toDate(value: any): Date | null {
    if (!value) return null;

    try {
      let date: Date;
      if (value instanceof Date) {
        date = value;
      } else if (typeof value.toDate === 'function') {
        date = value.toDate();
      } else if (typeof value === 'string' || typeof value === 'number') {
        date = new Date(value);
      } else {
        date = new Date(String(value));
      }
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  private static formatDateNative(date: Date, format: string): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return format
      .replace(/yyyy/g, String(date.getFullYear()))
      .replace(/MM/g, pad(date.getMonth() + 1))
      .replace(/dd/g, pad(date.getDate()))
      .replace(/HH/g, pad(date.getHours()))
      .replace(/mm/g, pad(date.getMinutes()))
      .replace(/ss/g, pad(date.getSeconds()));
  }

  private static toMomentFormat(angularFormat: string): string {
    return angularFormat
      .replace(/yyyy/g, 'YYYY')
      .replace(/MM/g, 'MM')
      .replace(/dd/g, 'DD')
      .replace(/HH/g, 'HH')
      .replace(/mm/g, 'mm')
      .replace(/ss/g, 'ss');
  }
}
