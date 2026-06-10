import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

export interface TestFixture {
  baseDir: string;
  imageDir: string;
  projectDir: string;
}

function pngHeader(w: number, h: number): Uint8Array {
  const sig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const crc32 = (buf: Uint8Array): number => {
    let c: number;
    const table: number[] = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  };
  const writeChunk = (type: string, data: Uint8Array): Uint8Array => {
    const typeBytes = new TextEncoder().encode(type);
    const len = new Uint8Array(4);
    const dv = new DataView(len.buffer);
    dv.setUint32(0, data.length);
    const combined = new Uint8Array(typeBytes.length + data.length);
    combined.set(typeBytes, 0);
    combined.set(data, typeBytes.length);
    const crcVal = crc32(combined);
    const crcBytes = new Uint8Array(4);
    const crcDv = new DataView(crcBytes.buffer);
    crcDv.setUint32(0, crcVal);
    const out = new Uint8Array(len.length + combined.length + crcBytes.length);
    out.set(len, 0);
    out.set(combined, len.length);
    out.set(crcBytes, len.length + combined.length);
    return out;
  };
  const ihdr = new Uint8Array(13);
  const ihdrDv = new DataView(ihdr.buffer);
  ihdrDv.setUint32(0, w);
  ihdrDv.setUint32(4, h);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = writeChunk('IHDR', ihdr);
  const raw = new Uint8Array((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const off = y * (w * 3 + 1) + 1 + x * 3;
      raw[off] = ((x * 17) % 256);
      raw[off + 1] = ((y * 23) % 256);
      raw[off + 2] = (((x + y) * 29) % 256);
    }
  }
  const compressed = deflateSync(raw);
  const idatChunk = writeChunk('IDAT', compressed);
  const iendChunk = writeChunk('IEND', new Uint8Array(0));
  const out = new Uint8Array(sig.length + ihdrChunk.length + idatChunk.length + iendChunk.length);
  let o = 0;
  out.set(sig, o); o += sig.length;
  out.set(ihdrChunk, o); o += ihdrChunk.length;
  out.set(idatChunk, o); o += idatChunk.length;
  out.set(iendChunk, o);
  return out;
}

function svgContent(w: number, h: number, viewBox?: string): string {
  const vb = viewBox ?? `0 0 ${w} ${h}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">
  <rect x="0" y="0" width="${w}" height="${h}" fill="#4a90d9"/>
  <circle cx="${w/2}" cy="${h/2}" r="${Math.min(w,h)/4}" fill="#fff"/>
</svg>`;
}

export function createTestFixtures(baseDir: string): TestFixture {
  const imageDir = join(baseDir, 'test-images');
  const projectDir = join(baseDir, 'test-project');
  mkdirSync(imageDir, { recursive: true });
  mkdirSync(projectDir, { recursive: true });
  mkdirSync(join(imageDir, 'icons'), { recursive: true });
  mkdirSync(join(imageDir, 'banners'), { recursive: true });
  mkdirSync(join(imageDir, 'avatars'), { recursive: true });

  writeFileSync(join(imageDir, 'icons', 'icon-ok.png'), pngHeader(64, 64));
  writeFileSync(join(imageDir, 'icons', 'icon-duplicate.png'), pngHeader(64, 64));
  writeFileSync(join(imageDir, 'icons', 'icon-large.png'), pngHeader(1024, 1024));
  writeFileSync(join(imageDir, 'banners', 'banner-hero.png'), pngHeader(1920, 1080));
  writeFileSync(join(imageDir, 'banners', 'banner-weird-ratio.png'), pngHeader(800, 300));
  writeFileSync(join(imageDir, 'banners', 'banner-small.png'), pngHeader(400, 225));
  writeFileSync(join(imageDir, 'avatars', 'avatar-square.png'), pngHeader(400, 400));
  writeFileSync(join(imageDir, 'avatars', 'avatar-rect.png'), pngHeader(400, 600));
  writeFileSync(join(imageDir, 'unused-old.png'), pngHeader(100, 100));
  writeFileSync(join(imageDir, 'unused-temp.png'), pngHeader(50, 50));
  writeFileSync(join(imageDir, 'logo.svg'), svgContent(300, 100));
  writeFileSync(join(imageDir, 'duplicate-of-icon.png'), pngHeader(64, 64));

  const tsxContent = `import React from 'react';
import heroImage from '../test-images/banners/banner-hero.png';
import logoSvg from '../test-images/logo.svg';
import squareAvatar from '../test-images/avatars/avatar-square.png';

export function App() {
  return (
    <div>
      <img src={heroImage} alt="Hero banner with product" />
      <img src={logoSvg} />
      <img src="/images/missing-icon.png" alt="Missing ref" />
      <img src={squareAvatar} />
    </div>
  );
}
`;
  writeFileSync(join(projectDir, 'App.tsx'), tsxContent);

  const htmlContent = `<!DOCTYPE html>
<html>
<body>
  <img src="../test-images/banners/banner-small.png" alt="Small banner">
  <img src="../test-images/icons/icon-ok.png">
</body>
</html>
`;
  writeFileSync(join(projectDir, 'index.html'), htmlContent);

  const cssContent = `.bg {
  background-image: url('../test-images/banners/banner-weird-ratio.png');
}
.avatar {
  background-image: url('../test-images/avatars/avatar-square.png');
}
`;
  writeFileSync(join(projectDir, 'style.css'), cssContent);

  const manifestContent = JSON.stringify([
    { imagePath: 'icons/icon-ok.png', alt: 'OK 图标' },
    { imagePath: 'banners/banner-hero.png', alt: '主横幅' },
    { imagePath: 'avatars/avatar-square.png' },
    'logo.svg'
  ], null, 2);
  writeFileSync(join(projectDir, 'manifest.json'), manifestContent);

  return { baseDir, imageDir, projectDir };
}
