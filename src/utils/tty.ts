import { stdout } from 'node:process';

export const write = (str: string): void => {
  if (stdout.isTTY) stdout.write(str);
};

export const cursor = {
  to(x: number, y: number): void {
    write(`\x1b[${y + 1};${x + 1}H`);
  },
  toColumn(n: number): void {
    write(`\x1b[${n + 1}G`);
  },
  move(x: number, y: number): void {
    if (x < 0) write(`\x1b[${-x}D`);
    else if (x > 0) write(`\x1b[${x}C`);
    if (y < 0) write(`\x1b[${-y}A`);
    else if (y > 0) write(`\x1b[${y}B`);
  },
  up(n = 1): void {
    write(`\x1b[${n}A`);
  },
  down(n = 1): void {
    write(`\x1b[${n}B`);
  },
  forward(n = 1): void {
    write(`\x1b[${n}C`);
  },
  backward(n = 1): void {
    write(`\x1b[${n}D`);
  },
  nextLine(n = 1): void {
    write(`\x1b[${n}E`);
  },
  prevLine(n = 1): void {
    write(`\x1b[${n}F`);
  },
  hide(): void {
    write('\x1b[?25l');
  },
  show(): void {
    write('\x1b[?25h');
  },
  save(): void {
    write('\x1b7');
  },
  restore(): void {
    write('\x1b8');
  },
};

export const erase = {
  screen: (): void => write('\x1b[2J'),
  screenEnd: (): void => write('\x1b[0J'),
  screenStart: (): void => write('\x1b[1J'),
  line: (): void => write('\x1b[2K'),
  lineEnd: (): void => write('\x1b[0K'),
  lineStart: (): void => write('\x1b[1K'),
};
