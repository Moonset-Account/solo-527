import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatCurrency' })
export class CurrencyPipe implements PipeTransform {
  transform(value: number | string, currency: string = 'CNY'): string {
    if (value === null || value === undefined) return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    const symbols: Record<string, string> = { CNY: '¥', USD: '$', EUR: '€' };
    const symbol = symbols[currency] || currency;
    return `${symbol}${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
