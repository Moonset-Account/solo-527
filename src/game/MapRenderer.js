import { clamp, lerp, uid, dist, easeOutCubic } from '../core/Utils.js';
import { createParticle, createShake } from '../core/Animator.js';
import { BUILDING_TYPE } from '../config/GameConfig.js';

export class MapRenderer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.map = null;
    this.camera = { x: 0, y: 0, zoom: 1, targetX: 0, targetY: 0, targetZoom: 1 };
    this.shakeFx = null;
    this.particles = [];
    this.hover = { x: 0, y: 0, worldX: 0, worldY: 0, node: null, building: null };
    this.selectionMarker = null;
    this.routePreview = null;
    this.eventBanners = [];
    this.animTime = 0;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  setMap(map) {
    this.map = map;
    if (map) {
      this.centerOn(map.width / 2, map.height / 2);
    }
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.viewW = rect.width;
    this.viewH = rect.height;
  }

  screenToWorld(sx, sy) {
    const x = (sx - this.viewW / 2) / this.camera.zoom + this.camera.x;
    const y = (sy - this.viewH / 2) / this.camera.zoom + this.camera.y;
    return { x, y };
  }

  worldToScreen(wx, wy) {
    const x = (wx - this.camera.x) * this.camera.zoom + this.viewW / 2;
    const y = (wy - this.camera.y) * this.camera.zoom + this.viewH / 2;
    return { x, y };
  }

  pan(dx, dy) {
    this.camera.x -= dx / this.camera.zoom;
    this.camera.y -= dy / this.camera.zoom;
    this._clampCamera();
  }

  zoomAt(sx, sy, factor) {
    const before = this.screenToWorld(sx, sy);
    this.camera.zoom = clamp(this.camera.zoom * factor, 0.4, 2.5);
    const after = this.screenToWorld(sx, sy);
    this.camera.x += before.x - after.x;
    this.camera.y += before.y - after.y;
  }

  setZoom(z) {
    this.camera.targetZoom = clamp(z, 0.4, 2.5);
  }

  centerOn(wx, wy, animate = true) {
    this.camera.targetX = wx;
    this.camera.targetY = wy;
    if (!animate) {
      this.camera.x = wx; this.camera.y = wy;
    }
  }

  _clampCamera() {
    if (!this.map) return;
    const halfVw = (this.viewW / 2) / this.camera.zoom;
    const halfVh = (this.viewH / 2) / this.camera.zoom;
    this.camera.x = clamp(this.camera.x, halfVw, this.map.width - halfVw);
    this.camera.y = clamp(this.camera.y, halfVh, this.map.height - halfVh);
  }

  setSelection(worldX, worldY, color = '#38bdf8') {
    this.selectionMarker = { x: worldX, y: worldY, color, life: 2.0, maxLife: 2.0 };
  }

  setRoutePreview(path, color = '#4ade80') {
    this.routePreview = path ? { path, color, life: 5.0 } : null;
  }

  addEventBanner(x, y, text, color = '#ef4444') {
    this.eventBanners.push({ x, y, text, color, life: 2.0, maxLife: 2.0, offset: 0 });
  }

  shake(duration, magnitude) {
    this.shakeFx = createShake(duration, magnitude);
  }

  emitParticles(x, y, color, count = 10, opts = {}) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (opts.speedMin ?? 30) + Math.random() * ((opts.speedMax ?? 80) - (opts.speedMin ?? 30));
      this.particles.push(createParticle(this.ctx, {
        x, y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: (opts.lifeMin ?? 0.4) + Math.random() * ((opts.lifeMax ?? 0.9) - (opts.lifeMin ?? 0.4)),
        size: (opts.sizeMin ?? 2) + Math.random() * ((opts.sizeMax ?? 5) - (opts.sizeMin ?? 2)),
        color, gravity: opts.gravity ?? 50,
      }));
    }
  }

  update(dt) {
    this.animTime += dt;
    const t = clamp(dt * 4, 0, 1);
    this.camera.x = lerp(this.camera.x, this.camera.targetX || this.camera.x, t);
    this.camera.y = lerp(this.camera.y, this.camera.targetY || this.camera.y, t);
    this.camera.zoom = lerp(this.camera.zoom, this.camera.targetZoom || this.camera.zoom, t);
    this._clampCamera();

    if (this.shakeFx) {
      this.shakeFx.update(dt);
      if (this.shakeFx.dead) this.shakeFx = null;
    }
    if (this.selectionMarker) {
      this.selectionMarker.life -= dt;
      if (this.selectionMarker.life <= 0) this.selectionMarker = null;
    }
    if (this.routePreview) {
      this.routePreview.life -= dt;
      if (this.routePreview.life <= 0) this.routePreview = null;
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].dead) this.particles.splice(i, 1);
    }
    for (let i = this.eventBanners.length - 1; i >= 0; i--) {
      this.eventBanners[i].life -= dt;
      this.eventBanners[i].offset += dt * 20;
      if (this.eventBanners[i].life <= 0) this.eventBanners.splice(i, 1);
    }
  }

  render(dt) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewW, this.viewH);

    let ox = 0, oy = 0;
    if (this.shakeFx) { ox = this.shakeFx.offsetX; oy = this.shakeFx.offsetY; }

    ctx.save();
    ctx.translate(this.viewW / 2 + ox, this.viewH / 2 + oy);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    this._drawBackground();
    if (this.map) {
      this._drawRegions();
      this._drawHazardAreas();
      this._drawRoads();
      this._drawBuildings();
      this._drawWarehouse();
      this._drawRoutePreview();
      this._drawTaskMarkers();
      this._drawResources();
      this._drawSelectionMarker();
      this._drawParticles();
      this._drawEventBanners();
    }
    ctx.restore();
    this._drawMinimap();
    this._drawHoverInfo();
  }

  _drawBackground() {
    if (!this.map) return;
    const ctx = this.ctx;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.map.width, this.map.height);
    const g = ctx.createLinearGradient(0, 0, this.map.width, this.map.height);
    g.addColorStop(0, '#1e293b');
    g.addColorStop(1, '#0f172a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.map.width, this.map.height);
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.08)';
    ctx.lineWidth = 1;
    const gs = 40;
    ctx.beginPath();
    for (let x = 0; x <= this.map.width; x += gs) {
      ctx.moveTo(x, 0); ctx.lineTo(x, this.map.height);
    }
    for (let y = 0; y <= this.map.height; y += gs) {
      ctx.moveTo(0, y); ctx.lineTo(this.map.width, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.map.width, this.map.height);
  }

  _drawRegions() {
    const ctx = this.ctx;
    for (const r of this.map.regions) {
      ctx.beginPath();
      ctx.arc(r.cx, r.cy, r.radius, 0, Math.PI * 2);
      const grd = ctx.createRadialGradient(r.cx, r.cy, 0, r.cx, r.cy, r.radius);
      const color = r.disaster ? '#ef4444' : '#38bdf8';
      grd.addColorStop(0, `${color}08`);
      grd.addColorStop(1, `${color}00`);
      ctx.fillStyle = grd;
      ctx.fill();
    }
  }

  _drawHazardAreas() {
    const ctx = this.ctx;
    for (const h of this.map.hazardAreas) {
      const pulse = 0.5 + 0.5 * Math.sin(this.animTime * 4);
      let color;
      switch (h.type) {
        case 'rainstorm': case 'flood': color = `rgba(56, 189, 248, ${0.18 + pulse * 0.1})`; break;
        case 'blackout': color = `rgba(250, 204, 21, ${0.12 + pulse * 0.08})`; break;
        case 'traffic_jam': color = `rgba(167, 139, 250, ${0.15 + pulse * 0.08})`; break;
        case 'fire': color = `rgba(239, 68, 68, ${0.22 + pulse * 0.12})`; break;
        default: color = `rgba(239, 68, 68, 0.2)`;
      }
      const grd = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r);
      grd.addColorStop(0, color);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = color.replace(/[\d.]+\)/, '0.7)');
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      const icons = { rainstorm: '🌧️', flood: '🌊', blackout: '💡', traffic_jam: '🚧', fire: '🔥' };
      ctx.fillText(icons[h.type] || '⚠️', h.x, h.y);
      ctx.restore();
    }
  }

  _drawRoads() {
    const ctx = this.ctx;
    const roadWidth = 14;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = roadWidth + 2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (const road of this.map.roads) {
      ctx.moveTo(road.a.x, road.a.y); ctx.lineTo(road.b.x, road.b.y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = roadWidth;
    ctx.beginPath();
    for (const road of this.map.roads) {
      ctx.moveTo(road.a.x, road.a.y); ctx.lineTo(road.b.x, road.b.y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = -this.animTime * 20;
    ctx.beginPath();
    for (const road of this.map.roads) {
      ctx.moveTo(road.a.x, road.a.y); ctx.lineTo(road.b.x, road.b.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    for (const n of this.map.intersections) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#475569'; ctx.fill();
    }
  }

  _drawBuildings() {
    const ctx = this.ctx;
    for (const b of this.map.buildings) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      roundRect(ctx, b.x + 4, b.y + 6, b.w, b.h, 4); ctx.fill();

      let col = b.color;
      if (b.flooded) col = blendColor(col, '#38bdf8', 0.5);
      if (!b.powered) col = blendColor(col, '#000', 0.4);
      if (b.blocked) col = blendColor(col, '#a78bfa', 0.3);
      ctx.fillStyle = col;
      roundRect(ctx, b.x, b.y, b.w, b.h, 4); ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      roundRect(ctx, b.x, b.y, b.w, b.h, 4); ctx.stroke();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
      const winSize = 5, gap = 8;
      const cols = Math.floor((b.w - 10) / gap);
      const rows = Math.floor((b.h - 10) / gap);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (b.powered || Math.random() > 0.92) {
            ctx.fillRect(b.x + 6 + c * gap, b.y + 6 + r * gap, winSize, winSize);
          }
        }
      }

      if (b.type === BUILDING_TYPE.HOSPITAL) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('✚', b.cx, b.cy);
      } else if (b.type === BUILDING_TYPE.SUBSTATION) {
        ctx.fillStyle = '#facc15'; ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⚡', b.cx, b.cy);
      } else if (b.type === BUILDING_TYPE.FIRE_STATION) {
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🚒', b.cx, b.cy);
      }

      if (b.flooded || !b.powered || b.blocked) {
        ctx.save();
        ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
        let ix = b.cx, iy = b.y - 10;
        if (b.flooded) ctx.fillText('🌊', ix, iy);
        if (!b.powered) ctx.fillText('⚠️', ix + 16, iy);
        if (b.blocked) ctx.fillText('🚧', ix - 16, iy);
        ctx.restore();
      }
    }
  }

  _drawWarehouse() {
    if (!this.map.warehouse) return;
    const ctx = this.ctx;
    const w = this.map.warehouse;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, w.x + 4, w.y + 6, w.w, w.h, 6); ctx.fill();
    const g = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
    g.addColorStop(0, '#38bdf8'); g.addColorStop(1, '#0ea5e9');
    ctx.fillStyle = g;
    roundRect(ctx, w.x, w.y, w.w, w.h, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
    roundRect(ctx, w.x, w.y, w.w, w.h, 6); ctx.stroke();
    ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('🏢', w.cx, w.cy);
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('指挥中心', w.cx, w.y + w.h + 12);
    const pulse = 0.5 + 0.5 * Math.sin(this.animTime * 3);
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 + pulse * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(w.cx, w.cy, 50 + pulse * 15, 0, Math.PI * 2); ctx.stroke();
  }

  _drawRoutePreview() {
    if (!this.routePreview) return;
    const ctx = this.ctx;
    const { path, color, life } = this.routePreview;
    ctx.save();
    ctx.globalAlpha = Math.min(1, life / 2);
    ctx.strokeStyle = color; ctx.lineWidth = 5;
    ctx.setLineDash([12, 8]); ctx.lineDashOffset = -this.animTime * 30;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const n = path[i];
      i === 0 ? ctx.moveTo(n.x, n.y) : ctx.lineTo(n.x, n.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawTaskMarkers() {
    const ctx = this.ctx;
    const tasks = this._taskProvider?.() || [];
    for (const task of tasks) {
      const pulse = 0.7 + 0.3 * Math.sin(this.animTime * 4 + task.id.length);
      const color = task._markerColor || '#ef4444';
      const r = task.priority === 'high' ? 22 : task.priority === 'mid' ? 18 : 15;

      ctx.beginPath();
      ctx.arc(task.x, task.y, r + pulse * 8, 0, Math.PI * 2);
      ctx.strokeStyle = `${color}44`; ctx.lineWidth = 3; ctx.stroke();

      ctx.beginPath();
      ctx.arc(task.x, task.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const icons = {
        power_restore: '⚡', flood_clear: '🌊', traffic_clear: '🚧',
        supply_deliver: '📦', road_repair: '🔧', fire_suppress: '🔥',
      };
      ctx.fillText(icons[task.type] || '❗', task.x, task.y);

      if (task.timeRemaining < task.timeLimit * 0.3) {
        const progress = task.timeRemaining / (task.timeLimit * 0.3);
        ctx.strokeStyle = progress > 0.5 ? '#facc15' : '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(task.x, task.y, r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
      }

      if (task.workProgress > 0 && task.workProgress < 1) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(task.x - r, task.y + r + 6, r * 2, 5);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(task.x - r, task.y + r + 6, r * 2 * task.workProgress, 5);
      }
    }
  }

  _drawResources() {
    const ctx = this.ctx;
    const resources = this._resourceProvider?.() || [];
    for (const r of resources) {
      const cfg = r._config || {};
      const color = cfg.color || '#38bdf8';

      if (r.path && r.path.length > 0) {
        ctx.strokeStyle = `${color}55`;
        ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -this.animTime * 20;
        ctx.beginPath(); ctx.moveTo(r.x, r.y);
        for (const n of r.path) ctx.lineTo(n.x, n.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.arc(r.x + 2, r.y + 4, 14, 0, Math.PI * 2); ctx.fill();

      const g = ctx.createRadialGradient(r.x, r.y, 4, r.x, r.y, 14);
      g.addColorStop(0, color); g.addColorStop(1, shade(color, -30));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(r.x, r.y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();

      ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(cfg.icon || '🚛', r.x, r.y);

      if (r.status === 'working') {
        const angle = this.animTime * 6;
        for (let i = 0; i < 3; i++) {
          const a = angle + (i / 3) * Math.PI * 2;
          const dx = Math.cos(a) * 20; const dy = Math.sin(a) * 20;
          ctx.fillStyle = `rgba(74, 222, 128, ${0.5 + 0.5 * Math.sin(this.animTime * 6 + i)})`;
          ctx.beginPath(); ctx.arc(r.x + dx, r.y + dy, 3, 0, Math.PI * 2); ctx.fill();
        }
      }

      if (r.selected) {
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]); ctx.lineDashOffset = -this.animTime * 20;
        ctx.beginPath(); ctx.arc(r.x, r.y, 20, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  _drawSelectionMarker() {
    if (!this.selectionMarker) return;
    const ctx = this.ctx;
    const t = this.selectionMarker.life / this.selectionMarker.maxLife;
    const r = 28 + (1 - t) * 18;
    ctx.strokeStyle = `${this.selectionMarker.color}`;
    ctx.globalAlpha = t; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(this.selectionMarker.x, this.selectionMarker.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  _drawParticles() {
    for (const p of this.particles) p.render();
  }

  _drawEventBanners() {
    const ctx = this.ctx;
    for (const e of this.eventBanners) {
      const t = e.life / e.maxLife;
      ctx.save();
      ctx.globalAlpha = easeOutCubic(t);
      ctx.font = 'bold 13px sans-serif';
      const metrics = ctx.measureText(e.text);
      const pad = 10;
      const w = metrics.width + pad * 2; const h = 26;
      const x = e.x - w / 2; const y = e.y - h - e.offset - 30;
      ctx.fillStyle = e.color;
      roundRect(ctx, x, y, w, h, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(e.text, e.x, y + h / 2);
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(e.x - 6, y + h);
      ctx.lineTo(e.x + 6, y + h);
      ctx.lineTo(e.x, y + h + 8); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  _drawMinimap() {
    if (!this.map) return;
    const ctx = this.ctx;
    const size = 150, pad = 16;
    const x = this.viewW - size - pad; const y = this.viewH - size - pad;
    const sx = size / this.map.width; const sy = size / this.map.height;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    roundRect(ctx, x, y, size, size, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = '#475569';
    for (const b of this.map.buildings) {
      ctx.fillRect(x + b.x * sx, y + b.y * sy, Math.max(1, b.w * sx), Math.max(1, b.h * sy));
    }
    ctx.fillStyle = '#38bdf8';
    for (const n of this.map.intersections) {
      ctx.fillRect(x + n.x * sx - 1, y + n.y * sy - 1, 2, 2);
    }

    const tasks = this._taskProvider?.() || [];
    for (const t of tasks) {
      ctx.fillStyle = t.priority === 'high' ? '#ef4444' : t.priority === 'mid' ? '#f59e0b' : '#22c55e';
      ctx.beginPath(); ctx.arc(x + t.x * sx, y + t.y * sy, 3, 0, Math.PI * 2); ctx.fill();
    }

    const resources = this._resourceProvider?.() || [];
    ctx.fillStyle = '#facc15';
    for (const r of resources) {
      ctx.fillRect(x + r.x * sx - 1, y + r.y * sy - 1, 3, 3);
    }

    const vw = this.viewW / this.camera.zoom * sx;
    const vh = this.viewH / this.camera.zoom * sy;
    const cx = x + this.camera.x * sx; const cy = y + this.camera.y * sy;
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - vw / 2, cy - vh / 2, vw, vh);

    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('小地图', x + 8, y + 14);
  }

  _drawHoverInfo() {
    if (!this.map || (!this.hover.building && !this.hover.node)) return;
    // Optional: tooltip rendered by UI layer
  }

  setTaskProvider(fn) { this._taskProvider = fn; }
  setResourceProvider(fn) { this._resourceProvider = fn; }
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function blendColor(hex1, hex2, t) {
  const p = (h) => {
    h = h.replace('#', '');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  };
  const a = p(hex1), b = p(hex2);
  const h = (v) => Math.round(v).toString(16).padStart(2, '0');
  return '#' + h(a.r + (b.r - a.r) * t) + h(a.g + (b.g - a.g) * t) + h(a.b + (b.b - a.b) * t);
}

function shade(hex, amount) {
  const h = hex.replace('#', '');
  const r = clamp(parseInt(h.slice(0, 2), 16) + amount, 0, 255);
  const g = clamp(parseInt(h.slice(2, 4), 16) + amount, 0, 255);
  const b = clamp(parseInt(h.slice(4, 6), 16) + amount, 0, 255);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
