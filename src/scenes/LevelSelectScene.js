import Phaser from 'phaser';
import { SCENE_KEYS, GAME_CONFIG } from '../config/GameConfig.js';
import { AnimationController } from '../systems/AnimationController.js';
import { SoundManager, SFX_TYPES } from '../systems/SoundManager.js';
import { LevelManager } from '../data/LevelData.js';

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.LEVEL_SELECT });
  }

  init() {
    this.animationCtrl = new AnimationController(this);
    this.soundManager = new SoundManager(this);
    this.levelManager = new LevelManager();
    this.selectedLevelId = null;
  }

  create() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0f1628);

    this.createHeader();

    const backBtn = this.add.text(40, 50, '← 返回菜单', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: colors.textSecondary
    });
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      this.soundManager.playSFX(SFX_TYPES.CLICK);
      this.scene.start(SCENE_KEYS.MENU);
    });

    const totalStars = this.levelManager.getTotalStars();
    const maxStars = this.levelManager.getMaxStars();
    const starsPanel = this.add.container(width - 100, 50);
    const starsBg = this.add.rectangle(0, 0, 200, 50, 0x1a2642, 0.9);
    starsBg.setStrokeStyle(2, colors.primary, 0.5);
    const starsText = this.add.text(-80, 0, `⭐ ${totalStars} / ${maxStars}`, {
      fontFamily: 'Arial',
      fontSize: '22px',
      fontStyle: 'bold',
      color: colors.warning
    });
    starsText.setOrigin(0, 0.5);
    starsPanel.add([starsBg, starsText]);
    this.animationCtrl.popIn(starsPanel, 300, 1, 200);

    this.createLevelCards();
    this.createFooter();
  }

  createHeader() {
    const { width } = this.scale;
    const colors = GAME_CONFIG.colors;

    const title = this.add.text(width / 2, 50, '关卡选择', {
      fontFamily: 'Arial',
      fontSize: '36px',
      fontStyle: 'bold',
      color: colors.primary
    });
    title.setOrigin(0.5);
    this.animationCtrl.slideIn(title, 'up', 500, 60, 100);

    const subtitle = this.add.text(width / 2, 90, '选择一个关卡开始调度挑战！', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: colors.textMuted
    });
    subtitle.setOrigin(0.5);
    this.animationCtrl.fadeIn(subtitle, 400, 0, 1, 300);
  }

  createLevelCards() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;
    const levels = this.levelManager.getAllLevels();

    const cardWidth = 340;
    const cardHeight = 260;
    const gap = 40;
    const startY = 180;
    const cols = Math.min(3, levels.length);
    const totalWidth = cols * cardWidth + (cols - 1) * gap;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;

    levels.forEach((level, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardWidth + gap);
      const y = startY + row * (cardHeight + 30);

      const card = this.createLevelCard(x, y, cardWidth, cardHeight, level, index);
      this.animationCtrl.popIn(card, 400, 1, 200 + index * 100);
    });
  }

  createLevelCard(x, y, w, h, level, index) {
    const colors = GAME_CONFIG.colors;
    const container = this.add.container(x, y);

    const isUnlocked = this.levelManager.isLevelUnlocked(level.id);
    const stars = this.levelManager.getStarsForLevel(level.id);
    const isCompleted = window.SaveSystem?.isLevelCompleted(level.id);

    const bgColor = isUnlocked ? 0x1a2642 : 0x0d1321;
    const alpha = isUnlocked ? 1 : 0.5;

    const bg = this.add.rectangle(0, 0, w, h, bgColor, alpha);
    bg.setStrokeStyle(2, isUnlocked ? colors.primary : 0x3d4f6f, alpha);

    const headerBg = this.add.rectangle(0, -h / 2 + 35, w, 70, 0x0f1628, 0.6);
    headerBg.setStrokeStyle(0, 0, 0);
    headerBg.setOrigin(0.5, 0);

    const levelNum = this.add.text(-w / 2 + 20, -h / 2 + 40, `关卡 ${String(index + 1).padStart(2, '0')}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: isUnlocked ? colors.primary : colors.textMuted
    });
    levelNum.setOrigin(0, 0);

    const difficulty = this.add.text(w / 2 - 20, -h / 2 + 40, '★'.repeat(level.difficulty) + '☆'.repeat(3 - level.difficulty), {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: colors.warning
    });
    difficulty.setOrigin(1, 0);

    const name = this.add.text(0, -h / 2 + 75, level.name, {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: isUnlocked ? colors.textPrimary : colors.textMuted
    });
    name.setOrigin(0.5);
    name.setWordWrapWidth(w - 40);

    const previewBg = this.add.rectangle(0, -20, w - 40, 80, 0x0f1628, 0.8);
    this.createTrackPreview(0, -20, w - 50, 70, level);

    const desc = this.add.text(-w / 2 + 20, 40, level.description, {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: colors.textSecondary
    });
    desc.setOrigin(0, 0);
    desc.setWordWrapWidth(w - 40);

    const starsDisplay = [];
    for (let i = 0; i < 3; i++) {
      const starX = (i - 1) * 26;
      const starColor = i < stars ? colors.warning : 0x3d4f6f;
      const star = this.add.text(starX, 100, '★', {
        fontFamily: 'Arial',
        fontSize: '26px',
        color: '#' + starColor.toString(16).padStart(6, '0')
      });
      star.setOrigin(0.5);
      starsDisplay.push(star);
    }

    const btnLabel = isUnlocked ? (isCompleted ? '再来一次' : '开始挑战') : '🔒 未解锁';
    const btnColor = isUnlocked ? colors.primary : colors.textMuted;
    const btnBgColor = isUnlocked ? 0x4a9eff : 0x3d4f6f;

    const btnW = 180;
    const btnH = 40;
    const btnBg = this.add.rectangle(0, h / 2 - 30, btnW, btnH, btnBgColor, 0.9);
    btnBg.setStrokeStyle(2, btnColor, 1);

    const btnText = this.add.text(0, h / 2 - 30, btnLabel, {
      fontFamily: 'Arial',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    btnText.setOrigin(0.5);

    container.add([bg, headerBg, levelNum, difficulty, name, previewBg, desc, ...starsDisplay, btnBg, btnText]);

    if (isUnlocked) {
      const hitArea = new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);
      container.setSize(w, h);
      container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

      container.on('pointerover', () => {
        this.tweens.add({ targets: bg, scale: 1.03, duration: 200 });
        this.tweens.add({ targets: btnBg, scale: 1.05, duration: 200 });
        this.soundManager.playSFX(SFX_TYPES.HOVER);
        container.bringToTop(bg);
      });

      container.on('pointerout', () => {
        this.tweens.add({ targets: bg, scale: 1, duration: 200 });
        this.tweens.add({ targets: btnBg, scale: 1, duration: 200 });
      });

      container.on('pointerdown', () => {
        this.selectedLevelId = level.id;
        this.tweens.add({
          targets: [bg, btnBg],
          scale: 0.97,
          duration: 100,
          yoyo: true
        });
        this.soundManager.playSFX(SFX_TYPES.CLICK);
      });

      container.on('pointerup', () => {
        if (this.selectedLevelId === level.id) {
          this.startLevel(level.id);
        }
      });
    }

    return container;
  }

  createTrackPreview(cx, cy, w, h, level) {
    const graphics = this.add.graphics();
    graphics.lineStyle(4, 0x3d4f6f, 0.8);

    const nodeCount = Math.min(level.nodes.length, 6);
    const spacing = w / (nodeCount + 1);

    for (let i = 0; i < nodeCount - 1; i++) {
      const x1 = cx - w / 2 + spacing * (i + 1);
      const x2 = cx - w / 2 + spacing * (i + 2);
      const y1 = cy + (i % 2 === 0 ? -8 : 8);
      const y2 = cy + ((i + 1) % 2 === 0 ? -8 : 8);
      graphics.beginPath();
      graphics.moveTo(x1, y1);
      graphics.lineTo(x2, y2);
      graphics.strokePath();
    }

    for (let i = 0; i < nodeCount; i++) {
      const nx = cx - w / 2 + spacing * (i + 1);
      const ny = cy + (i % 2 === 0 ? -8 : 8);
      const nodeType = level.nodes[i]?.type || 'normal';
      let nodeColor = 0x3d4f6f;
      if (nodeType === 'spawn') nodeColor = 0x4ecdc4;
      else if (nodeType === 'terminal') nodeColor = 0xff6b6b;
      else if (nodeType === 'platform') nodeColor = 0x6c5ce7;
      else if (nodeType === 'junction') nodeColor = 0x4a9eff;

      graphics.fillStyle(nodeColor, 1);
      graphics.fillCircle(nx, ny, 8);
    }

    return graphics;
  }

  createFooter() {
    const { width, height } = this.scale;
    const colors = GAME_CONFIG.colors;

    const tipText = this.add.text(width / 2, height - 40,
      '💡 提示：完成关卡可以获得更多星星，解锁新的挑战！',
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: colors.textMuted
      }
    );
    tipText.setOrigin(0.5);
    this.animationCtrl.fadeIn(tipText, 600, 0, 1, 800);
  }

  startLevel(levelId) {
    this.animationCtrl.screenFlash(0x4a9eff, 0.2, 200);
    this.time.delayedCall(300, () => {
      this.scene.start(SCENE_KEYS.GAME, { levelId });
    });
  }
}
