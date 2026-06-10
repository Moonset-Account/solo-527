import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';

@Injectable()
export class OrderNoService {
  private counter = 0;

  generate(prefix: string = 'QD'): string {
    const dateStr = dayjs().format('YYYYMMDD');
    this.counter = (this.counter + 1) % 10000;
    const seq = String(this.counter).padStart(4, '0');
    return `${prefix}${dateStr}${seq}`;
  }

  generateWithPrefix(prefix: string): string {
    const dateStr = dayjs().format('YYYYMMDDHHmmss');
    this.counter = (this.counter + 1) % 100;
    const seq = String(this.counter).padStart(2, '0');
    return `${prefix}${dateStr}${seq}`;
  }
}
