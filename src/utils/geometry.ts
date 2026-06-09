import type { Vec2 } from '../game/types';

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function mul(a: Vec2, s: number): Vec2 {
  return { x: a.x * s, y: a.y * s };
}

export function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function length(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

export function pointToSegmentDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const ab = sub(b, a);
  const ap = sub(p, a);
  const abSquared = ab.x * ab.x + ab.y * ab.y;
  if (abSquared === 0) return dist(p, a);
  let t = (ap.x * ab.x + ap.y * ab.y) / abSquared;
  t = Math.max(0, Math.min(1, t));
  const projection = add(a, mul(ab, t));
  return dist(p, projection);
}

export function rotatePoint(p: Vec2, center: Vec2, angleRadians: number): Vec2 {
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function snapToGrid(v: Vec2, gridSize: number = 20): Vec2 {
  return {
    x: Math.round(v.x / gridSize) * gridSize,
    y: Math.round(v.y / gridSize) * gridSize,
  };
}

export function rectContainsPoint(
  rect: { x: number; y: number; w: number; h: number },
  p: Vec2,
): boolean {
  return (
    p.x >= rect.x &&
    p.x <= rect.x + rect.w &&
    p.y >= rect.y &&
    p.y <= rect.y + rect.h
  );
}
