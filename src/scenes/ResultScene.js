import Phaser from 'phaser';
import { SCENE_KEYS, GAME_CONFIG } from '../config/GameConfig.js';
import { AnimationController } from '../systems/AnimationController.js';
import { SoundManager, SFX_TYPES } from '../systems/SoundManager.js';
import { LevelManager } from '../data/LevelData.js';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.RESULT });
  }

  init(data) {
    this.animationCtrl = new AnimationController(this);
    this.soundManager = new SoundManager(this);
    this.levelManager = new LevelManager();

    this.resultData = data?.result || {
      success: false,
      levelId: 'level_01',
      levelName: '测试关卡',
      score: 0,
      stars: 0,
      time: 0,
      trainsCompleted: 0,
      trainsTotal: 3,
      onTimeRate: 0,
      conflicts: [],
      criticalConflicts: 0,
      reason: null,
      sessionData: null
    };

    this.isSuccess = this.resultData.success;
  }

  create() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0f1628);

    if (this.isSuccess) {
      this.createVictoryScene();
    } else {
      this.createFailureScene();
    }
  }

  createVictoryScene() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;
    const data = this.resultData;

    this.animationCtrl.screenFlash(0x4ecdc4, 0.15, 400);
    this.time.delayedCall(100, () => {
      this.animationCtrl.createConfetti(width / 2, 100, 50);
    });
    this.time.delayedCall(500, () => {
      this.animationCtrl.createConfetti(width / 4, 150, 30);
      this.animationCtrl.createConfetti(width * 3 / 4, 150, 30);
    });

    this.soundManager.playSFX(SFX_TYPES.SUCCESS, 1.5);

    const titleBg = this.add.container(width / 2, 120);
    const title = this.add.text(0, 0, '🎉 调度成功！', {
      fontFamily: 'Arial',
      fontSize: '56px',
      fontStyle: 'bold',
      color: colors.success
    });
    title.setOrigin(0.5);
    title.setShadow(4, 4, 'rgba(78,205,196,0.4)', 0, false, true);
    titleBg.add(title);
    this.animationCtrl.popIn(titleBg, 600, 1, 300);

    const levelLabel = this.add.text(width / 2, 190, `${data.levelName}`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: colors.textSecondary
    });
    levelLabel.setOrigin(0.5);
    this.animationCtrl.fadeIn(levelLabel, 400, 0, 1, 500);

    this.createStarsDisplay(width / 2, 280, data.stars);

    const mainPanel = this.add.container(width / 2, 470);
    const panelW = 720;
    const panelH = 300;

    const panelBg = this.add.rectangle(0, 0, panelW, panelH, 0x1a2642, 0.95);
    panelBg.setStrokeStyle(2, colors.success, 0.6);

    const stats = [
      { label: '完成用时', value: this.formatTime(data.time), icon: '⏱️', color: colors.textPrimary },
      { label: '正点率', value: `${data.onTimeRate}%`, icon: '⏰', color: data.onTimeRate >= 90 ? colors.success : (data.onTimeRate >= 70 ? colors.warning : colors.danger) },
      { label: '列车完成', value: `${data.trainsCompleted} / ${data.trainsTotal}`, icon: '🚄', color: colors.textPrimary },
      { label: '最终得分', value: data.score.toString(), icon: '🏆', color: colors.primary }
    ];

    stats.forEach((stat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const sx = -panelW / 2 + 120 + col * (panelW / 2);
      const sy = -panelH / 2 + 80 + row * 110;

      const iconText = this.add.text(sx - 60, sy, stat.icon, { fontSize: '36px' });
      iconText.setOrigin(0.5);

      const valText = this.add.text(sx + 10, sy - 10, stat.value, {
        fontFamily: 'Arial',
        fontSize: '28px',
        fontStyle: 'bold',
        color: stat.color
      });
      valText.setOrigin(0, 0);

      const lblText = this.add.text(sx + 10, sy + 25, stat.label, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: colors.textMuted
      });
      lblText.setOrigin(0, 0);

      mainPanel.add([iconText, valText, lblText]);
    });

    if (data.conflicts && data.conflicts.length > 0) {
      const conflictLabel = this.add.text(-panelW / 2 + 30, panelH / 2 - 50, '本次冲突情况：', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: colors.textSecondary
      });
      conflictLabel.setOrigin(0, 0.5);

      const conflictInfo = this.getConflictSummary(data.conflicts);
      const conflictText = this.add.text(panelW / 2 - 30, panelH / 2 - 50, conflictInfo, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: data.criticalConflicts > 0 ? colors.danger : colors.warning
      });
      conflictText.setOrigin(1, 0.5);

      mainPanel.add([conflictLabel, conflictText]);
    }

    mainPanel.add(panelBg);
    this.animationCtrl.slideIn(mainPanel, 'down', 500, 80, 600);

    this.createButtons(width / 2, height - 80, data);
  }

  createFailureScene() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;
    const data = this.resultData;

    this.animationCtrl.screenFlash(0xff4757, 0.2, 300);
    this.soundManager.playSFX(SFX_TYPES.FAIL, 1.2);

    const titleBg = this.add.container(width / 2, 120);
    const title = this.add.text(0, 0, '💥 调度失败', {
      fontFamily: 'Arial',
      fontSize: '56px',
      fontStyle: 'bold',
      color: colors.danger
    });
    title.setOrigin(0.5);
    title.setShadow(4, 4, 'rgba(255,71,87,0.4)', 0, false, true);
    titleBg.add(title);
    this.animationCtrl.popIn(titleBg, 600, 1, 300);

    const levelLabel = this.add.text(width / 2, 190, `${data.levelName}`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: colors.textSecondary
    });
    levelLabel.setOrigin(0.5);
    this.animationCtrl.fadeIn(levelLabel, 400, 0, 1, 500);

    const reasonContainer = this.add.container(width / 2, 290);
    const reasonW = 640;
    const reasonH = 140;

    const reasonBg = this.add.rectangle(0, 0, reasonW, reasonH, 0x2a1a1a, 0.95);
    reasonBg.setStrokeStyle(2, colors.danger, 0.6);

    const reasonTitle = this.add.text(0, -reasonH / 2 + 25, '❌ 失败原因', {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: colors.danger
    });
    reasonTitle.setOrigin(0.5);

    const reasonMsg = this.getFailureReasonMessage(data);
    const reasonText = this.add.text(-reasonW / 2 + 30, 0, reasonMsg, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: colors.textPrimary,
      wordWrap: { width: reasonW - 60 }
    });
    reasonText.setOrigin(0, 0.5);

    reasonContainer.add([reasonBg, reasonTitle, reasonText]);
    this.animationCtrl.slideIn(reasonContainer, 'left', 400, 100, 600);

    if (data.conflicts && data.conflicts.length > 0) {
      const conflictsPanel = this.add.container(width / 2, 450);
      const cpW = 640;
      const cpH = 180;

      const cpBg = this.add.rectangle(0, 0, cpW, cpH, 0x1a2642, 0.95);
      cpBg.setStrokeStyle(2, colors.warning, 0.5);

      const cpTitle = this.add.text(-cpW / 2 + 25, -cpH / 2 + 25, '⚠️ 冲突详情', {
        fontFamily: 'Arial',
        fontSize: '16px',
        fontStyle: 'bold',
        color: colors.warning
      });
      cpTitle.setOrigin(0, 0);

      const conflictList = this.formatConflictList(data.conflicts, cpH - 50);
      const listText = this.add.text(-cpW / 2 + 25, -cpH / 2 + 55, conflictList, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: colors.textSecondary,
        wordWrap: { width: cpW - 50 },
        lineSpacing: 6
      });
      listText.setOrigin(0, 0);

      conflictsPanel.add([cpBg, cpTitle, listText]);
      this.animationCtrl.slideIn(conflictsPanel, 'right', 400, 100, 750);
    }

    this.createButtons(width / 2, height - 80, data);
  }

  createStarsDisplay(cx, cy, stars) {
    const colors = GAME_CONFIG.colors;
    const container = this.add.container(cx, cy);

    for (let i = 0; i < 3; i++) {
      const delay = 400 + i * 250;
      const x = (i - 1) * 90;
      const color = i < stars ? colors.warning : 0x3d4f6f;

      const starText = this.add.text(x, 0, '★', {
        fontFamily: 'Arial',
        fontSize: '80px',
        fontStyle: 'bold',
        color: '#' + color.toString(16).padStart(6, '0')
      });
      starText.setOrigin(0.5);
      starText.setScale(0);
      container.add(starText);

      this.tweens.add({
        targets: starText,
        scale: 1,
        duration: 400,
        delay,
        ease: 'Back.easeOut',
        onComplete: () => {
          if (i < stars) {
            this.soundManager.playSFX(SFX_TYPES.STAR);
            this.animationCtrl.starBurst(x + cx, cy, 0xffd93d, 6, 50);
          }
        }
      });

      if (i < stars) {
        this.tweens.add({
          targets: starText,
          scale: 1.1,
          duration: 500,
          delay: delay + 500,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: 2
        });
      }
    }

    const label = this.add.text(0, 70,
      stars === 3 ? '完美调度！' : (stars === 2 ? '良好表现！' : (stars === 1 ? '完成任务！' : '继续加油！')),
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: stars > 0 ? colors.success : colors.textMuted
      }
    );
    label.setOrigin(0.5);
    label.setAlpha(0);
    this.animationCtrl.fadeIn(label, 300, 0, 1, 400 + 3 * 250 + 300);

    container.add(label);
    return container;
  }

  createButtons(cx, cy, data) {
    const colors = GAME_CONFIG.colors;

    const replayBtn = this.createResultButton(cx - 260, cy, '查看回放', 'secondary', () => {
      if (data.sessionData && data.sessionData.actions && data.sessionData.actions.length > 0) {
        this.soundManager.playSFX(SFX_TYPES.CLICK);
        this.scene.start(SCENE_KEYS.REPLAY, {
          levelId: data.levelId,
          sessionData: data.sessionData,
          resultData: data
        });
      } else {
        this.soundManager.playSFX(SFX_TYPES.ERROR);
        this.showToast('暂无回放数据');
      }
    });

    const retryBtn = this.createResultButton(cx, cy, this.isSuccess ? '再来一次' : '重新挑战', 'primary', () => {
      this.soundManager.playSFX(SFX_TYPES.CLICK);
      this.scene.start(SCENE_KEYS.GAME, { levelId: data.levelId });
    });

    const nextBtn = null;
    if (this.isSuccess) {
      const levels = this.levelManager.getAllLevels();
      const idx = levels.findIndex(l => l.id === data.levelId);
      if (idx >= 0 && idx < levels.length - 1) {
        const nextLevel = levels[idx + 1];
        const isUnlocked = this.levelManager.isLevelUnlocked(nextLevel.id);
        if (isUnlocked) {
          this.createResultButton(cx + 260, cy, '下一关 →', 'success', () => {
            this.soundManager.playSFX(SFX_TYPES.CLICK);
            this.scene.start(SCENE_KEYS.GAME, { levelId: nextLevel.id });
          });
        } else {
          this.createResultButton(cx + 260, cy, '🔒 下一关未解锁', 'secondary', () => {
            this.soundManager.playSFX(SFX_TYPES.ERROR);
            this.showToast('请先获得更多星星来解锁下一关');
          });
        }
      } else {
        this.createResultButton(cx + 260, cy, '返回菜单', 'secondary', () => {
          this.soundManager.playSFX(SFX_TYPES.CLICK);
          this.scene.start(SCENE_KEYS.MENU);
        });
      }
    } else {
      this.createResultButton(cx + 260, cy, '返回菜单', 'secondary', () => {
        this.soundManager.playSFX(SFX_TYPES.CLICK);
        this.scene.start(SCENE_KEYS.MENU);
      });
    }

    return [replayBtn, retryBtn, nextBtn];
  }

  createResultButton(x, y, label, style, callback) {
    const colors = GAME_CONFIG.colors;
    const container = this.add.container(x, y);

    let bgColor = 0x4a9eff;
    let borderColor = 0x7eb8ff;
    let textColor = '#ffffff';

    if (style === 'secondary') {
      bgColor = 0x1a2642;
      borderColor = colors.primary;
      textColor = colors.primary;
    } else if (style === 'success') {
      bgColor = 0x4ecdc4;
      borderColor = 0x7be3dd;
    }

    const w = 180;
    const h = 50;
    const bg = this.add.rectangle(0, 0, w, h, bgColor, 0.95);
    bg.setStrokeStyle(2, borderColor, 1);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial',
      fontSize: '17px',
      fontStyle: 'bold',
      color: textColor
    });
    text.setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(w, h);

    bg.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

    bg.on('pointerover', () => {
      this.tweens.add({ targets: bg, scale: 1.05, duration: 150 });
      this.tweens.add({ targets: text, scale: 1.05, duration: 150 });
      this.soundManager.playSFX(SFX_TYPES.HOVER);
    });

    bg.on('pointerout', () => {
      this.tweens.add({ targets: bg, scale: 1, duration: 150 });
      this.tweens.add({ targets: text, scale: 1, duration: 150 });
    });

    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: [bg, text],
        scale: 0.95,
        duration: 100,
        yoyo: true
      });
      this.soundManager.playSFX(SFX_TYPES.CLICK);
    });

    bg.on('pointerup', () => {
      if (callback && typeof callback === 'function') callback();
    });

    this.animationCtrl.fadeIn(container, 400, 0, 1, 900);

    return container;
  }

  showToast(message, duration = 2000) {
    const { width, height } = this.scale;
    const toast = this.add.container(width / 2, height / 2 - 200);
    const bg = this.add.rectangle(0, 0, 300, 50, 0x1a2642, 0.95);
    bg.setStrokeStyle(2, GAME_CONFIG.colors.primary, 1);
    const text = this.add.text(0, 0, message, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: GAME_CONFIG.colors.textPrimary
    });
    text.setOrigin(0.5);
    toast.add([bg, text]);
    toast.setDepth(9999);
    this.animationCtrl.popIn(toast, 300);
    this.time.delayedCall(duration, () => {
      this.animationCtrl.popOut(toast, 300);
    });
  }

  formatTime(seconds) {
    if (seconds == null || isNaN(seconds)) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}分${secs.toString().padStart(2, '0')}秒`;
  }

  getConflictSummary(conflicts) {
    const critical = conflicts.filter(c => c.severity === 'critical').length;
    const warning = conflicts.filter(c => c.severity === 'warning').length;
    const parts = [];
    if (critical > 0) parts.push(`严重 ${critical}`);
    if (warning > 0) parts.push(`警告 ${warning}`);
    return parts.length > 0 ? parts.join('，') : '无冲突';
  }

  formatConflictList(conflicts, maxHeight) {
    if (!conflicts || conflicts.length === 0) return '无冲突记录';

    const typeNames = GAME_CONFIG.conflictTypes;
    const grouped = {};
    conflicts.forEach(c => {
      const key = c.type;
      if (!grouped[key]) grouped[key] = { count: 0, info: typeNames[key], first: c };
      grouped[key].count++;
    });

    const lines = Object.entries(grouped).map(([type, data]) => {
      const name = data.info?.name || type;
      const desc = data.info?.description || '';
      return `• ${name}（×${data.count}） - ${desc}`;
    });

    return lines.join('\n');
  }

  getFailureReasonMessage(data) {
    if (data.reason) {
      const typeInfo = GAME_CONFIG.conflictTypes[data.reason];
      if (typeInfo) {
        return `主要原因：${typeInfo.name}\n${typeInfo.description}\n\n💡 建议：下次注意提前规划${typeInfo.name.includes('同轨') ? '道岔方向和列车优先级' : (typeInfo.name.includes('信号') ? '信号灯时序' : (typeInfo.name.includes('站台') ? '站台占用情况' : '列车时刻'))}，避免冲突发生。`;
      }
      return data.reason;
    }

    if (data.criticalConflicts > 0) {
      return '调度过程中发生了严重的轨道冲突，导致任务失败。\n\n💡 建议：仔细观察信号灯和道岔位置，合理安排优先级，避免列车在同一轨道交汇。';
    }

    if (data.trainsCompleted < data.trainsTotal) {
      return `有 ${data.trainsTotal - data.trainsCompleted} 列列车未能在规定时间内到达终点。\n\n💡 建议：优化列车路径，提高通行效率，合理设置信号放行时机。`;
    }

    if (data.onTimeRate < 50) {
      return `列车正点率过低（${data.onTimeRate}%），调度效果不理想。\n\n💡 建议：减少不必要的等待，让优先级高的列车优先通过。`;
    }

    return '任务未完成，请重新规划调度方案。\n\n💡 提示：先理清列车路径，再安排信号和优先级。';
  }
}
