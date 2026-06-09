import type { Vec2, Rect } from '@/types';

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function addV(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subV(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scaleV(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function lengthV(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function distanceV(a: Vec2, b: Vec2): number {
  return lengthV(subV(a, b));
}

export function normalizeV(v: Vec2): Vec2 {
  const len = lengthV(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpV(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

export function pointInRect(p: Vec2, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
}

export function rectIntersect(a: Rect, b: Rect): boolean {
  return !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y);
}

export function distanceToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const ab = subV(b, a);
  const ap = subV(p, a);
  const t = clamp((ap.x * ab.x + ap.y * ab.y) / (ab.x * ab.x + ab.y * ab.y), 0, 1);
  const closest = addV(a, scaleV(ab, t));
  return distanceV(p, closest);
}

export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
