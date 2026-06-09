export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (v - a) / (b - a);
export const remap = (v, a1, b1, a2, b2) => lerp(a2, b2, invLerp(a1, b1, v));
export const rand = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const distSq = (ax, ay, bx, by) => (bx - ax) ** 2 + (by - ay) ** 2;
export const angle = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);

export const aabb = (a, b) => (
  a.x < b.x + b.w && a.x + a.w > b.x &&
  a.y < b.y + b.h && a.y + a.h > b.y
);
export const pointInRect = (px, py, r) => (
  px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h
);
export const pointInCircle = (px, py, cx, cy, r) => distSq(px, py, cx, cy) <= r * r;

export const formatTime = (seconds) => {
  seconds = Math.max(0, Math.floor(seconds));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
export const formatCountdown = (seconds) => {
  const sign = seconds < 0 ? '-' : '';
  return sign + formatTime(Math.abs(seconds));
};
export const formatNumber = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutElastic = (t) => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};
export const easeOutBounce = (t) => {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

export const priorityCompare = (a, b) => {
  const order = { high: 0, mid: 1, low: 2 };
  if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
  return (a.timeLimit - a.timeElapsed) - (b.timeLimit - b.timeElapsed);
};

export const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
};
export const rgbToHex = (r, g, b) =>
  '#' + [r, g, b].map(x => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')).join('');

export class Vector2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  mul(s) { return new Vector2(this.x * s, this.y * s); }
  div(s) { return new Vector2(this.x / s, this.y / s); }
  length() { return Math.hypot(this.x, this.y); }
  normalize() { const l = this.length(); return l > 0 ? this.div(l) : new Vector2(); }
  dist(v) { return Math.hypot(v.x - this.x, v.y - this.y); }
  clone() { return new Vector2(this.x, this.y); }
  static lerp(a, b, t) { return new Vector2(lerp(a.x, b.x, t), lerp(a.y, b.y, t)); }
}
