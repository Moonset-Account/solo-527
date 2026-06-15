import { Pipe, PipeTransform } from '@angular/core';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

@Pipe({ name: 'formatDate' })
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date, formatStr: string = 'yyyy-MM-dd'): string {
    if (!value) return '-';
    try {
      const date = typeof value === 'string' ? parseISO(value) : value;
      return format(date, formatStr, { locale: zhCN });
    } catch {
      return String(value);
    }
  }
}

@Pipe({ name: 'formatDateTime' })
export class DateTimeFormatPipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '-';
    try {
      const date = typeof value === 'string' ? parseISO(value) : value;
      return format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN });
    } catch {
      return String(value);
    }
  }
}
