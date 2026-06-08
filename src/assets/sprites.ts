import { PlaceholderAsset } from './placeholders';

interface SpriteCache {
  [key: string]: HTMLCanvasElement;
}

const cache: SpriteCache = {};

export function getSprite(asset: PlaceholderAsset): HTMLCanvasElement {
  if (cache[asset.id]) return cache[asset.id];
  const canvas = document.createElement('canvas');
  canvas.width = asset.width * 2;
  canvas.height = asset.height * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);
  ctx.fillStyle = asset.color;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  if (asset.type === 'apparatus') {
    ctx.globalAlpha = 0.7;
    ctx.fillRect(2, 2, asset.width - 4, asset.height - 4);
    ctx.globalAlpha = 1;
    ctx.strokeRect(2, 2, asset.width - 4, asset.height - 4);
  } else if (asset.type === 'reagent') {
    ctx.fillRect(4, asset.height * 0.3, asset.width - 8, asset.height * 0.65);
    ctx.fillRect(asset.width * 0.3, 4, asset.width * 0.4, asset.height * 0.3);
  } else if (asset.type === 'effect') {
    ctx.beginPath();
    ctx.arc(asset.width / 2, asset.height / 2, Math.min(asset.width, asset.height) / 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(2, 2, asset.width - 4, asset.height - 4);
    ctx.strokeRect(2, 2, asset.width - 4, asset.height - 4);
  }
  ctx.fillStyle = '#fff';
  ctx.font = '8px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(asset.label, asset.width / 2, asset.height / 2);
  cache[asset.id] = canvas;
  return canvas;
}

export function clearSpriteCache(): void {
  Object.keys(cache).forEach(key => delete cache[key]);
}
