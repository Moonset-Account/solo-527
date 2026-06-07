declare module 'drizzle-kit' {
  export function defineConfig(config: any): any;
}

declare module 'pg' {
  export class Pool {
    constructor(config?: any);
  }
}

declare module 'jsonwebtoken' {
  export function sign(payload: any, secret: string, options?: any): string;
  export function verify(token: string, secret: string): any;
}

declare module 'bcryptjs' {
  export function hash(s: string, salt: number): Promise<string>;
  export function compare(s: string, hash: string): Promise<boolean>;
}

declare module 'papaparse' {
  export function parse(input: string, options?: any): any;
  export function unparse(data: any, options?: any): string;
}

declare module '@react-pdf/renderer' {
  export const Document: any;
  export const Page: any;
  export const Text: any;
  export const View: any;
  export const StyleSheet: any;
  export const pdf: any;
  export const Font: any;
}
