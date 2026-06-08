// ========================================================
// 场景渲染器 - 2D 俯视角 + 伪3D感
// ========================================================
import { LEVELS, DECOR, ITEMS } from './gameData.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = canvas.width;
    this.H = canvas.height;
    this.TILE = 32;
    this.camera = { x: 0, y: 0 };
    this.settings = { brightness: 1.0, filmgrain: true, vignette: true };

    this.flashAlpha = 0;
    this.shakeOffset = { x: 0, y: 0 };
    this.shakeDecay = 0;
  }

  // 屏幕震动
  shake(intensity = 6, duration = 0.3) {
    this._shakeIntensity = intensity;
    this.shakeDecay = duration;
  }

  // 屏幕闪光 (颜色)
  flash(color = '#ffffff', intensity = 0.4, duration = 0.3) {
    this.flashColor = color;
    this.flashAlpha = intensity;
    this._flashDuration = duration;
  }

  update(dt) {
    // 震动衰减
    if (this.shakeDecay > 0) {
      this.shakeDecay -= dt;
      if (this.shakeDecay <= 0) {
        this.shakeOffset = { x: 0, y: 0 };
      } else {
        const k = this._shakeIntensity * (this.shakeDecay / 0.3);
        this.shakeOffset.x = (Math.random() - 0.5) * k;
        this.shakeOffset.y = (Math.random() - 0.5) * k;
      }
    }
    // 闪光衰减
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt / this._flashDuration);
    }
  }

  // ============== 主渲染 ==============
  render(levelId, player, state, interactables) {
    const level = LEVELS[levelId];
    if (!level) return;

    const ctx = this.ctx;

    // 摄像机跟随玩家 (屏幕中心)
    this.camera.x = player.pos.x * this.TILE - this.W / 2;
    this.camera.y = player.pos.y * this.TILE - this.H / 2;

    // 摄像机限制在关卡内
    this.camera.x = Math.max(0, Math.min(level.gridWidth * this.TILE - this.W, this.camera.x));
    this.camera.y = Math.max(0, Math.min(level.gridHeight * this.TILE - this.H, this.camera.y));

    ctx.save();
    ctx.translate(this.shakeOffset.x, this.shakeOffset.y);

    // 1. 背景 & 地板分区
    this._drawFloor(level);

    // 2. 家具装饰 (Y 排序)
    this._drawDecor(levelId);

    // 3. 物品 (Y 排序)
    this._drawItems(level, state, interactables);

    // 4. 门
    this._drawDoors(level, state);

    // 5. 墙壁
    this._drawWalls(level);

    // 6. 玩家
    this._drawPlayer(player);

    // 7. 视野内交互提示高亮
    this._drawInteractHighlight(player, interactables, state);

    ctx.restore();

    // 屏幕闪光
    if (this.flashAlpha > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.globalAlpha = 1;
    }

    // 亮度
    if (this.settings.brightness !== 1.0) {
      ctx.fillStyle = `rgba(0,0,0,${1 - this.settings.brightness})`;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.globalCompositeOperation = 'source-over';
    }

    // 暗角 (CSS层处理, 这里加个柔和的)
    if (this.settings.vignette) {
      const grd = ctx.createRadialGradient(this.W/2, this.H/2, Math.min(this.W,this.H)*0.35, this.W/2, this.H/2, Math.max(this.W,this.H)*0.75);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, this.W, this.H);
    }
  }

  _worldToScreen(wx, wy) {
    return {
      x: wx * this.TILE - this.camera.x,
      y: wy * this.TILE - this.camera.y,
    };
  }

  _drawFloor(level) {
    const ctx = this.ctx;
    // 逐区域渲染地板
    (level.floorZones || []).forEach(zone => {
      const p = this._worldToScreen(zone.x, zone.y);
      ctx.fillStyle = zone.color;
      ctx.fillRect(p.x, p.y, zone.w * this.TILE, zone.h * this.TILE);

      // 木板纹
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      for (let y = 0; y < zone.h; y++) {
        const ly = p.y + y * this.TILE;
        ctx.beginPath();
        ctx.moveTo(p.x, ly);
        ctx.lineTo(p.x + zone.w * this.TILE, ly);
        ctx.stroke();
      }
    });
  }

  _drawDecor(levelId) {
    const ctx = this.ctx;
    const decor = DECOR[levelId] || [];
    decor.forEach(d => {
      const p = this._worldToScreen(d.x, d.y);
      const w = d.w * this.TILE, h = d.h * this.TILE;
      // 阴影
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(p.x + 4, p.y + h + 2, w - 4, 6);
      // 家具本体
      switch (d.type) {
        case 'sofa': this._furniture(ctx, p.x, p.y, w, h, '#5C3A21', '#3E2A14'); break;
        case 'coffeetable': this._furniture(ctx, p.x, p.y, w, h, '#4A3828', '#2C1810'); break;
        case 'tvcabinet':
        case 'sideboard':
        case 'bookshelf':
        case 'bookshelf_s':
        case 'medicinecabinet':
        case 'wardrobe':
        case 'dresser':
        case 'shelves':
          this._furniture(ctx, p.x, p.y, w, h, '#6B4423', '#422814'); break;
        case 'nightstand':
        case 'toybox':
        case 'shoerack':
        case 'umbrellastand':
          this._furniture(ctx, p.x, p.y, w, h, '#7A5030', '#4A2E18'); break;
        case 'bed_master':
          this._bed(ctx, p.x, p.y, w, h, '#806050', '#C8B898'); break;
        case 'bed_single':
          this._bed(ctx, p.x, p.y, w, h, '#605070', '#D8C8E0'); break;
        case 'window':
          ctx.fillStyle = '#1A1D26';
          ctx.fillRect(p.x, p.y, w, h);
          ctx.strokeStyle = '#8B5A2B'; ctx.lineWidth = 4;
          ctx.strokeRect(p.x, p.y, w, h);
          break;
        case 'diningtable':
        case 'desk_daughter':
          this._table(ctx, p.x, p.y, w, h, '#8B6840', '#5A3820'); break;
        case 'fridge':
          this._furniture(ctx, p.x, p.y, w, h, '#D8D8D8', '#808080'); break;
        case 'sink':
        case 'bathtub':
          ctx.fillStyle = '#C8D0D8';
          ctx.fillRect(p.x, p.y, w, h);
          ctx.strokeStyle = '#707880'; ctx.lineWidth = 2;
          ctx.strokeRect(p.x, p.y, w, h);
          break;
        case 'stove':
          this._furniture(ctx, p.x, p.y, w, h, '#303030', '#101010'); break;
        case 'boxes':
          for (let i = 0; i < 3; i++) {
            ctx.fillStyle = ['#6B5040','#705030','#605040'][i];
            ctx.fillRect(p.x + i*w*0.3, p.y + (i%2)*h*0.4, w*0.35, h*0.7);
            ctx.strokeStyle = '#302010'; ctx.lineWidth = 1;
            ctx.strokeRect(p.x + i*w*0.3, p.y + (i%2)*h*0.4, w*0.35, h*0.7);
          }
          break;
        case 'pipes':
          ctx.fillStyle = '#505860';
          ctx.fillRect(p.x, p.y, w, h);
          ctx.fillStyle = '#303840';
          for (let i = 0; i < 5; i++) {
            ctx.fillRect(p.x + i * w*0.2 + 4, p.y - 4, 12, h+8);
          }
          break;
        case 'fuse':
          this._furniture(ctx, p.x, p.y, w, h, '#303030', '#101010');
          // 指示灯
          ctx.fillStyle = Math.random() > 0.02 ? '#ff3030' : '#400000';
          ctx.fillRect(p.x + w*0.3, p.y + 10, 6, 6);
          break;
        case 'trunk_old':
          this._furniture(ctx, p.x, p.y, w, h, '#3E2A14', '#201008');
          // 锁
          ctx.fillStyle = '#CD9B1D';
          ctx.fillRect(p.x + w/2 - 6, p.y + 2, 12, 14);
          break;
        case 'waterpuddle':
          ctx.fillStyle = 'rgba(80,120,140,0.5)';
          ctx.beginPath();
          ctx.ellipse(p.x + w/2, p.y + h/2, w/2, h/2, 0, 0, Math.PI*2);
          ctx.fill();
          break;
        default:
          this._furniture(ctx, p.x, p.y, w, h, '#666', '#333');
      }
    });
  }

  _furniture(ctx, x, y, w, h, top, side) {
    // 侧面 (伪3D)
    ctx.fillStyle = side;
    ctx.fillRect(x, y + 6, w, h);
    // 顶面
    ctx.fillStyle = top;
    ctx.fillRect(x, y, w, h - 4);
    // 高光边
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, w, 3);
    // 边框
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  _bed(ctx, x, y, w, h, frame, sheet) {
    // 床架
    ctx.fillStyle = frame;
    ctx.fillRect(x, y + 6, w, h);
    // 床垫
    ctx.fillStyle = sheet;
    ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
    // 枕头
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 10, y + 10, w - 20, h * 0.25);
    // 床被子 (折叠)
    ctx.fillStyle = sheet;
    ctx.fillRect(x + 6, y + 6 + h*0.35, w - 12, h * 0.55);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.strokeRect(x, y + 6, w, h);
  }

  _table(ctx, x, y, w, h, top, leg) {
    ctx.fillStyle = top;
    ctx.fillRect(x, y, w, 8);
    ctx.fillStyle = leg;
    ctx.fillRect(x + 2, y + 8, 5, h - 8);
    ctx.fillRect(x + w - 7, y + 8, 5, h - 8);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.strokeRect(x, y, w, 8);
  }

  _drawItems(level, state, interactables) {
    const ctx = this.ctx;
    const items = level.items || [];
    // Y 排序
    const sorted = [...items].sort((a, b) => a.y - b.y);

    sorted.forEach(item => {
      // 隐藏物品（需要触发条件）
      if (item.hidden && !this._shouldShowHidden(item, state)) return;
      // 已拾取
      if (item.itemId && state.collectedItems.has(item.itemId)) return;

      const data = ITEMS[item.itemId] || { color: '#CD9B1D', icon: '❓', displayName: '?' };
      const p = this._worldToScreen(item.x, item.y);
      const size = this.TILE;

      // 阴影
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(p.x + size/2, p.y + size*0.9, size*0.3, size*0.1, 0, 0, Math.PI*2);
      ctx.fill();

      // 底座圆
      const hovered = interactables?.current === item;
      if (hovered) {
        ctx.strokeStyle = 'rgba(232, 200, 122, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(p.x + size/2, p.y + size*0.9, size*0.5, size*0.18, 0, 0, Math.PI*2);
        ctx.stroke();
      }

      // 图标
      ctx.save();
      // 悬浮浮动动画
      const bob = Math.sin(Date.now()/500 + (item.x + item.y)) * 2;
      ctx.translate(p.x + size/2, p.y + size/2 + bob);
      const isPuzzle = item.isPuzzle;
      const scale = hovered ? 1.25 : 1;
      ctx.scale(scale, scale);
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 8;
      ctx.fillText(isPuzzle ? '🔒' : (data.icon || '📦'), 0, 0);
      ctx.restore();

      // 谜题锁状态
      if (isPuzzle && state.solvedPuzzles.has(item.itemId)) {
        ctx.fillStyle = 'rgba(138, 181, 138, 0.85)';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓ 已解', p.x + size/2, p.y + size + 16);
      }
    });
  }

  // 判断隐藏物品是否应显示 (如书架后钥匙需要靠近才显形)
  _shouldShowHidden(item, state) {
    // 第1章钥匙: 需要检查书架 (通过交互触发，这里直接允许显示但有距离)
    return true;
  }

  _drawDoors(level, state) {
    const ctx = this.ctx;
    (level.doors || []).forEach(door => {
      const p = this._worldToScreen(door.x, door.y);
      const w = door.w * this.TILE, h = door.h * this.TILE;
      const unlocked = !door.locked || state.collectedItems.has(door.keyItem) || state.openedDoors.has(door.id);
      // 门框
      ctx.fillStyle = '#2C1810';
      ctx.fillRect(p.x - 4, p.y - 4, w + 8, h + 8);
      // 门板
      ctx.fillStyle = unlocked ? '#6B4423' : '#3E2A14';
      ctx.fillRect(p.x, p.y, w, h);
      // 门把手
      ctx.fillStyle = unlocked ? '#CD9B1D' : '#505050';
      const knobX = door.w === 1 ? p.x + w*0.75 : p.x + w*0.5;
      const knobY = door.h === 1 ? p.y + h*0.5 : p.y + h*0.5;
      ctx.beginPath();
      ctx.arc(knobX, knobY, Math.min(w,h)*0.12, 0, Math.PI*2);
      ctx.fill();
      // 锁图标
      if (!unlocked && !state.collectedItems.has(door.keyItem)) {
        ctx.fillStyle = '#E8A050';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', knobX, p.y - 10);
      }
      // 门名牌
      if (door.name) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(255,245,200,0.6)';
        ctx.textAlign = 'center';
        ctx.fillText(door.name, p.x + w/2, p.y + h + 12);
      }
    });
  }

  _drawWalls(level) {
    const ctx = this.ctx;
    (level.walls || []).forEach(w => {
      const p = this._worldToScreen(w[0], w[1]);
      const wall = w;
      const x = p.x, y = p.y;
      const ww = wall[2] * this.TILE, hh = wall[3] * this.TILE;
      // 墙底
      ctx.fillStyle = '#1C1410';
      ctx.fillRect(x, y, ww, hh);
      // 墙顶高光
      ctx.fillStyle = '#3A2820';
      ctx.fillRect(x, y, ww, 4);
      // 纹理竖线
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      const step = this.TILE;
      for (let i = 0; i < ww; i += step) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i, y + hh);
        ctx.stroke();
      }
    });
  }

  _drawPlayer(player) {
    const ctx = this.ctx;
    const p = this._worldToScreen(player.pos.x, player.pos.y);
    const size = this.TILE * 0.9;
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + size*0.4, size*0.45, size*0.15, 0, 0, Math.PI*2);
    ctx.fill();
    // 人物圆
    ctx.fillStyle = '#D8C090';
    ctx.beginPath();
    ctx.arc(p.x, p.y, size*0.35, 0, Math.PI*2);
    ctx.fill();
    // 方向指示 (朝向)
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(player.yaw);
    ctx.fillStyle = '#5C3A21';
    ctx.beginPath();
    ctx.moveTo(size*0.35, 0);
    ctx.lineTo(size*0.05, -size*0.18);
    ctx.lineTo(size*0.05, size*0.18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // 交互范围圆 (非常淡)
    ctx.strokeStyle = 'rgba(205, 155, 29, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 1.2, 0, Math.PI*2);
    ctx.stroke();
  }

  _drawInteractHighlight(player, interactables, state) {
    // 已经在物品渲染里处理了 hover 状态
  }

  // 碰撞检测
  isWall(levelId, x, y) {
    const level = LEVELS[levelId];
    if (!level) return true;
    if (x < 0.5 || y < 0.5 || x >= level.gridWidth - 0.5 || y >= level.gridHeight - 0.5) return true;
    const walls = level.walls || [];
    for (const w of walls) {
      if (x >= w[0] - 0.3 && x < w[0] + w[2] + 0.3 &&
          y >= w[1] - 0.3 && y < w[1] + w[3] + 0.3) return true;
    }
    // 家具碰撞 (简化: 把大的decor算成墙)
    const decor = DECOR[levelId] || [];
    for (const d of decor) {
      if (['sofa','tvcabinet','wardrobe','dresser','bed_master','bed_single',
           'bookshelf','bookshelf_s','bathtub','fridge','stove','trunk_old',
           'shelves','boxes','fuse','toybox','shoerack','nightstand',
           'sideboard','medicinecabinet','diningtable','desk_daughter','coffeetable',
           'umbrellastand'].includes(d.type)) {
        if (x >= d.x - 0.3 && x < d.x + d.w + 0.3 &&
            y >= d.y - 0.3 && y < d.y + d.h + 0.3) return true;
      }
    }
    return false;
  }
}
