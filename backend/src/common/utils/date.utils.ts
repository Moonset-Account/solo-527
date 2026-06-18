export class DateUtils {
  static parseStartOfDay(dateStr: string): Date {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  static parseEndOfDay(dateStr: string): Date {
    const date = new Date(dateStr);
    date.setHours(23, 59, 59, 999);
    return date;
  }
}
