import type { ImageFormat } from '../types';

export interface ImageDimensions {
  width: number;
  height: number;
}

export class ImageDimensionParser {
  static parse(buffer: Uint8Array, format: ImageFormat): ImageDimensions {
    switch (format) {
      case 'png':
        return this.parsePNG(buffer);
      case 'jpg':
      case 'jpeg':
        return this.parseJPEG(buffer);
      case 'gif':
        return this.parseGIF(buffer);
      case 'webp':
        return this.parseWEBP(buffer);
      case 'avif':
        return this.parseAVIF(buffer);
      case 'bmp':
        return this.parseBMP(buffer);
      case 'ico':
        return this.parseICO(buffer);
      case 'svg':
        return this.parseSVG(buffer);
      default:
        return { width: 0, height: 0 };
    }
  }

  private static readUInt32BE(buffer: Uint8Array, offset: number): number {
    const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return dv.getUint32(offset, false);
  }

  private static readUInt32LE(buffer: Uint8Array, offset: number): number {
    const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return dv.getUint32(offset, true);
  }

  private static readUInt16BE(buffer: Uint8Array, offset: number): number {
    const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return dv.getUint16(offset, false);
  }

  private static readUInt16LE(buffer: Uint8Array, offset: number): number {
    const dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return dv.getUint16(offset, true);
  }

  private static parsePNG(buffer: Uint8Array): ImageDimensions {
    if (buffer.length < 24) return { width: 0, height: 0 };
    if (
      buffer[0] !== 0x89 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x4e ||
      buffer[3] !== 0x47
    ) {
      return { width: 0, height: 0 };
    }
    return {
      width: this.readUInt32BE(buffer, 16),
      height: this.readUInt32BE(buffer, 20),
    };
  }

  private static parseJPEG(buffer: Uint8Array): ImageDimensions {
    if (buffer.length < 2) return { width: 0, height: 0 };
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return { width: 0, height: 0 };

    let offset = 2;
    while (offset < buffer.length - 1) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      let marker = buffer[offset + 1];
      while (marker === 0xff && offset + 1 < buffer.length) {
        offset++;
        marker = buffer[offset + 1];
      }
      if (
        marker === 0xc0 ||
        marker === 0xc1 ||
        marker === 0xc2 ||
        marker === 0xc3 ||
        marker === 0xc5 ||
        marker === 0xc6 ||
        marker === 0xc7 ||
        marker === 0xc9 ||
        marker === 0xca ||
        marker === 0xcb ||
        marker === 0xcd ||
        marker === 0xce ||
        marker === 0xcf
      ) {
        if (offset + 8 < buffer.length) {
          return {
            height: this.readUInt16BE(buffer, offset + 5),
            width: this.readUInt16BE(buffer, offset + 7),
          };
        }
      }
      if (offset + 3 < buffer.length) {
        const segmentLen = this.readUInt16BE(buffer, offset + 2);
        offset += 2 + segmentLen;
      } else {
        break;
      }
    }
    return { width: 0, height: 0 };
  }

  private static parseGIF(buffer: Uint8Array): ImageDimensions {
    if (buffer.length < 10) return { width: 0, height: 0 };
    const signature = new TextDecoder().decode(buffer.slice(0, 6));
    if (signature !== 'GIF87a' && signature !== 'GIF89a') {
      return { width: 0, height: 0 };
    }
    return {
      width: this.readUInt16LE(buffer, 6),
      height: this.readUInt16LE(buffer, 8),
    };
  }

  private static parseWEBP(buffer: Uint8Array): ImageDimensions {
    if (buffer.length < 30) return { width: 0, height: 0 };
    const riff = new TextDecoder().decode(buffer.slice(0, 4));
    const webp = new TextDecoder().decode(buffer.slice(8, 12));
    if (riff !== 'RIFF' || webp !== 'WEBP') return { width: 0, height: 0 };

    const vp8 = new TextDecoder().decode(buffer.slice(12, 16));
    if (vp8 === 'VP8 ' && buffer.length > 30) {
      if (buffer[20] === 0x9d && buffer[21] === 0x01 && buffer[22] === 0x2a) {
        return {
          width: this.readUInt16LE(buffer, 26) & 0x3fff,
          height: this.readUInt16LE(buffer, 28) & 0x3fff,
        };
      }
    }
    if (vp8 === 'VP8L' && buffer.length > 25) {
      const b1 = buffer[21];
      const b2 = buffer[22];
      const b3 = buffer[23];
      const b4 = buffer[24];
      const width = 1 + (((b2 & 0x3f) << 8) | b1);
      const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
      return { width, height };
    }
    if (vp8 === 'VP8X' && buffer.length > 30) {
      const w1 = buffer[24];
      const w2 = buffer[25];
      const w3 = buffer[26];
      const h1 = buffer[27];
      const h2 = buffer[28];
      const h3 = buffer[29];
      return {
        width: 1 + (w1 | (w2 << 8) | (w3 << 16)),
        height: 1 + (h1 | (h2 << 8) | (h3 << 16)),
      };
    }
    return { width: 0, height: 0 };
  }

  private static parseAVIF(buffer: Uint8Array): ImageDimensions {
    if (buffer.length < 12) return { width: 0, height: 0 };
    const ftype = new TextDecoder().decode(buffer.slice(4, 8));
    if (ftype !== 'ftyp') return { width: 0, height: 0 };

    let offset = this.readUInt32BE(buffer, 0);
    while (offset < buffer.length - 8) {
      const boxSize = this.readUInt32BE(buffer, offset);
      const boxType = new TextDecoder().decode(buffer.slice(offset + 4, offset + 8));
      if (boxType === 'meta') {
        const metaStart = offset + 8;
        const ispeOffset = this.findBox(buffer, metaStart, boxSize - 8, ['iprp', 'ipco', 'ispe']);
        if (ispeOffset > 0 && ispeOffset + 16 < buffer.length) {
          return {
            width: this.readUInt32BE(buffer, ispeOffset + 8),
            height: this.readUInt32BE(buffer, ispeOffset + 12),
          };
        }
      }
      if (boxSize === 0) break;
      offset += boxSize;
    }
    return { width: 0, height: 0 };
  }

  private static findBox(
    buffer: Uint8Array,
    start: number,
    size: number,
    nestedPath: string[],
  ): number {
    if (nestedPath.length === 0) return start;
    const target = nestedPath[0];
    let offset = start;
    const end = start + size;
    while (offset + 8 < end) {
      const boxSize = this.readUInt32BE(buffer, offset);
      const boxType = new TextDecoder().decode(buffer.slice(offset + 4, offset + 8));
      if (boxType === target) {
        if (nestedPath.length === 1) {
          return offset + 8;
        }
        return this.findBox(buffer, offset + 8, boxSize - 8, nestedPath.slice(1));
      }
      if (boxSize === 0) break;
      offset += boxSize;
    }
    return -1;
  }

  private static parseBMP(buffer: Uint8Array): ImageDimensions {
    if (buffer.length < 26) return { width: 0, height: 0 };
    if (buffer[0] !== 0x42 || buffer[1] !== 0x4d) return { width: 0, height: 0 };
    return {
      width: this.readUInt32LE(buffer, 18),
      height: Math.abs(this.readUInt32LE(buffer, 22) as number),
    };
  }

  private static parseICO(buffer: Uint8Array): ImageDimensions {
    if (buffer.length < 6) return { width: 0, height: 0 };
    const count = this.readUInt16LE(buffer, 4);
    if (count === 0) return { width: 0, height: 0 };
    const entryOffset = 6;
    let maxW = 0;
    let maxH = 0;
    for (let i = 0; i < count && entryOffset + i * 16 + 2 < buffer.length; i++) {
      const w = buffer[entryOffset + i * 16] || 256;
      const h = buffer[entryOffset + i * 16 + 1] || 256;
      if (w > maxW) maxW = w;
      if (h > maxH) maxH = h;
    }
    return { width: maxW, height: maxH };
  }

  private static parseSVG(buffer: Uint8Array): ImageDimensions {
    try {
      const text = new TextDecoder().decode(buffer);
      const viewBox = text.match(/viewBox\s*=\s*["']([^"']+)["']/i);
      const widthAttr = text.match(/<svg[^>]*\swidth\s*=\s*["']([^"']+)["']/i);
      const heightAttr = text.match(/<svg[^>]*\sheight\s*=\s*["']([^"']+)["']/i);

      let w = 0;
      let h = 0;

      if (viewBox) {
        const parts = viewBox[1].split(/[\s,]+/).map(Number);
        if (parts.length === 4) {
          w = Math.round(parts[2]);
          h = Math.round(parts[3]);
        }
      }
      if (widthAttr) {
        const parsed = parseInt(widthAttr[1], 10);
        if (!isNaN(parsed)) w = parsed;
      }
      if (heightAttr) {
        const parsed = parseInt(heightAttr[1], 10);
        if (!isNaN(parsed)) h = parsed;
      }
      return { width: w, height: h };
    } catch {
      return { width: 0, height: 0 };
    }
  }
}
