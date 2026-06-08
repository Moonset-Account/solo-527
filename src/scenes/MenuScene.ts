import Phaser from 'phaser';
import { COLORS } from '@config/constants';
import { configManager } from '@systems/ConfigManager';
import { saveSystem } from '@systems/SaveSystem';
import { audioSystem } from '@systems/AudioSystem';
import { LevelConfig } from '@core/types';

export class MenuScene extends Phaser.Scene {
  private levelButtons: Map<string, Phaser.GameObjects.Container> = new Map();

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    
    this.createBackgroundDecor();
    this.createTitle();
    this.createLevelSelection();
    this.createBottomMenu();
    this.startAmbient();

    this.scale.on('resize', () => this.onResize());
  }

  private createBackgroundDecor(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 0; i < 40; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = Math.random() * 3 + 1;
      const alpha = Math.random() * 0.3 + 0.1;

      const star = this.add.circle(x, y, size, COLORS.accent, alpha);
      this.tweens.add({
        targets: star,
        alpha: alpha + 0.2,
        duration: 1500 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    const bookColors = [0xe06c75, 0x98c379, 0x56b6c2, 0xc678dd, 0xe5c07b, 0x7aa2f7];
    for (let i = 0; i < 12; i++) {
      const x = (w / 13) * (i + 1);
      const y = h * (0.92 + Math.sin(i * 0.7) * 0.03);
      const color = bookColors[i % bookColors.length];
      const bookH = 60 + Math.random() * 30;
      const bookW = 35 + Math.random() * 15;

      const book = this.add.rectangle(x, y - bookH / 2, bookW, bookH, color, 0.12);
      book.setStrokeStyle(2, color, 0.25);
    }
  }

  private createTitle(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height * 0.18;

    const glow = this.add.graphics();
    glow.fillStyle(COLORS.accent, 0.08);
    glow.fillCircle(cx, cy + 20, 180);
    this.tweens.add({
      targets: glow,
      alpha: 0.15,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const icon = this.add.text(cx, cy - 80, '📚', {
      fontFamily: 'monospace',
      fontSize: '60px'
    });
    icon.setOrigin(0.5);
    this.tweens.add({
      targets: icon,
      y: cy - 90,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const title = this.add.text(cx, cy, '夜间书店整理谜题', {
      fontFamily: 'monospace',
      fontSize: '52px',
      color: '#e8e8f0',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: 1.02,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const subtitle = this.add.text(cx, cy + 56, 'Night Bookstore Puzzle', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#7aa2f7'
    });
    subtitle.setOrigin(0.5);

    const desc = this.add.text(cx, cy + 100, '在闭店后的书店里，移动书架、收集线索、修复索引卡，将每本书放回正确的位置', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8892b0',
      align: 'center',
      wordWrap: { width: 600 }
    });
    desc.setOrigin(0.5);
  }

  private createLevelSelection(): void {
    const builtInLevels = configManager.getBuiltInLevels();
    const customLevels = configManager.getCustomLevels();
    const allLevels = [...builtInLevels, ...customLevels];

    if (allLevels.length === 0) return;

    const cx = this.scale.width / 2;
    const startY = this.scale.height * 0.45;

    const sectionTitle = this.add.text(cx, startY - 30, '选择关卡', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffd866',
      fontStyle: 'bold'
    });
    sectionTitle.setOrigin(0.5);

    const cardW = 220;
    const cardH = 140;
    const spacing = 30;
    const totalW = Math.min(allLevels.length, 3) * cardW + (Math.min(allLevels.length, 3) - 1) * spacing;
    let startX = cx - totalW / 2 + cardW / 2;

    allLevels.forEach((level, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = startX + col * (cardW + spacing);
      const y = startY + row * (cardH + spacing);

      this.createLevelCard(x, y, cardW, cardH, level, index + 1);
    });
  }

  private createLevelCard(x: number, y: number, w: number, h: number, level: LevelConfig, num: number): void {
    const card = this.add.container(x, y);

    const bg = this.add.graphics();
    const isCustom = level.id.startsWith('custom_');
    const accent = isCustom ? COLORS.indexCardFixed : COLORS.accent;

    bg.fillStyle(COLORS.hudBg, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.lineStyle(2, COLORS.hudBorder, 0.8);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);

    const progress = saveSystem.getLevelProgress(level.id);
    if (progress && progress.stars > 0) {
      bg.lineStyle(3, COLORS.success, 0.6);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    }

    const numberBg = this.add.graphics();
    numberBg.fillStyle(accent, 0.2);
    numberBg.fillCircle(-w / 2 + 30, -h / 2 + 28, 18);

    const number = this.add.text(-w / 2 + 30, -h / 2 + 28, isCustom ? 'C' : num.toString(), {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#e8e8f0',
      fontStyle: 'bold'
    });
    number.setOrigin(0.5);

    const name = this.add.text(-w / 2 + 60, -h / 2 + 20, level.name, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#e8e8f0',
      fontStyle: 'bold',
      wordWrap: { width: w - 80 }
    });
    name.setOrigin(0, 0);

    const desc = this.add.text(0, -h / 2 + 60, level.description, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#8892b0',
      align: 'center',
      wordWrap: { width: w - 24 }
    });
    desc.setOrigin(0.5, 0);

    const infoY = h / 2 - 30;

    const stepsText = this.add.text(-w / 2 + 16, infoY, `👣 ${level.maxSteps}步`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#8892b0'
    });
    stepsText.setOrigin(0, 0.5);

    const booksText = this.add.text(0, infoY, `📚 ${level.targetBooks.length}本`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#8892b0'
    });
    booksText.setOrigin(0.5, 0.5);

    const sizeText = this.add.text(w / 2 - 16, infoY, `${level.width}×${level.height}`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#8892b0'
    });
    sizeText.setOrigin(1, 0.5);

    if (progress) {
      const starsY = -h / 2 + 100;
      for (let i = 0; i < 3; i++) {
        const s = this.add.text(-w / 2 + 16 + i * 28, starsY, '★', {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: i < progress.stars ? '#ffd866' : '#3a3a4a',
          fontStyle: 'bold'
        });
        s.setOrigin(0, 0.5);
      }

      if (progress.bestSteps) {
        const best = this.add.text(w / 2 - 16, starsY, `最佳 ${progress.bestSteps}步`, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#98c379'
        });
        best.setOrigin(1, 0.5);
      }
    }

    card.add([bg, numberBg, number, name, desc, stepsText, booksText, sizeText]);

    card.setSize(w, h);
    card.setInteractive();

    card.on('pointerover', () => {
      this.tweens.add({
        targets: card,
        scale: 1.04,
        duration: 150,
        ease: 'Cubic.easeOut'
      });
      bg.lineStyle(3, accent, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
      audioSystem.play('select');
    });

    card.on('pointerout', () => {
      card.setScale(1);
      bg.lineStyle(2, COLORS.hudBorder, 0.8);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
      if (progress && progress.stars > 0) {
        bg.lineStyle(3, COLORS.success, 0.6);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
      }
    });

    card.on('pointerdown', () => {
      this.tweens.add({
        targets: card,
        scale: 0.96,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          audioSystem.play('click');
          this.startLevel(level.id);
        }
      });
    });

    this.levelButtons.set(level.id, card);
  }

  private createBottomMenu(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const cy = h - 50;

    const buttons = [
      { label: '⚙ 设置', action: () => this.openSettings() },
      { label: '🛠 关卡编辑器', action: () => this.openEditor() },
      { label: '📖 操作说明', action: () => this.showHelp() },
      { label: '🔄 重置进度', action: () => this.confirmReset() }
    ];

    const totalW = buttons.length * 140 + (buttons.length - 1) * 20;
    let startX = w / 2 - totalW / 2 + 70;

    buttons.forEach((btn, i) => {
      const x = startX + i * 160;
      
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.hudBorder, 0.6);
      bg.fillRoundedRect(x - 70, cy - 20, 140, 40, 8);
      
      bg.setInteractive(new Phaser.Geom.Rectangle(x - 70, cy - 20, 140, 40), Phaser.Geom.Rectangle.Contains);

      bg.on('pointerover', () => {
        bg.fillStyle(COLORS.accent, 0.4);
        bg.fillRoundedRect(x - 70, cy - 20, 140, 40, 8);
        audioSystem.play('select');
      });
      bg.on('pointerout', () => {
        bg.fillStyle(COLORS.hudBorder, 0.6);
        bg.fillRoundedRect(x - 70, cy - 20, 140, 40, 8);
      });
      bg.on('pointerdown', () => {
        audioSystem.play('click');
        btn.action();
      });

      const text = this.add.text(x, cy, btn.label, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#e8e8f0'
      });
      text.setOrigin(0.5);
    });

    const version = this.add.text(w - 20, h - 20, 'v1.0.0 | 制作 By Phaser', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#5a5a7a'
    });
    version.setOrigin(1, 0.5);
  }

  private startLevel(levelId: string): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('GameScene', { levelId });
    });
  }

  private openEditor(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('EditorScene');
    });
  }

  private openSettings(): void {
    const settings = saveSystem.getSettings();

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1, 1), Phaser.Geom.Rectangle.Contains);

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.hudBg, 0.98);
    panel.fillRoundedRect(cx - 240, cy - 250, 480, 500, 16);
    panel.lineStyle(2, COLORS.accent, 0.6);
    panel.strokeRoundedRect(cx - 240, cy - 250, 480, 500, 16);

    const title = this.add.text(cx, cy - 210, '⚙ 设置', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#e8e8f0',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const options = [
      { label: '音效音量', value: settings.sfxVolume, min: 0, max: 1, step: 0.1, onChange: (v: number) => audioSystem.setSFXVolume(v) },
      { label: '音乐音量', value: settings.musicVolume, min: 0, max: 1, step: 0.1, onChange: (v: number) => audioSystem.setMusicVolume(v) },
      { label: '显示FPS', value: settings.showFPS ? 1 : 0, min: 0, max: 1, step: 1, onChange: (v: number) => configManager.updateSettings({ showFPS: v === 1 }) },
      { label: '显示网格', value: settings.showGrid ? 1 : 0, min: 0, max: 1, step: 1, onChange: (v: number) => configManager.updateSettings({ showGrid: v === 1 }) }
    ];

    options.forEach((opt, i) => {
      const oy = cy - 140 + i * 90;

      const label = this.add.text(cx - 200, oy, opt.label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#8892b0'
      });
      label.setOrigin(0, 0);

      if (opt.step === 1) {
        const bg = this.add.graphics();
        const val = opt.value === 1;
        bg.fillStyle(val ? COLORS.success : COLORS.hudBorder, 0.9);
        bg.fillRoundedRect(cx + 100, oy - 4, 60, 28, 14);
        const knob = this.add.circle(cx + (val ? 140 : 120), oy + 10, 11, 0xffffff);
        
        bg.setInteractive(new Phaser.Geom.Rectangle(cx + 100, oy - 4, 60, 28), Phaser.Geom.Rectangle.Contains);
        bg.on('pointerdown', () => {
          const newVal = val ? 0 : 1;
          opt.onChange(newVal);
          this.add.text(cx, cy - 300, '设置已保存', { color: '#98c379' });
        });
      }
    });

    const close = this.add.text(cx, cy + 180, '点击任意处关闭', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#8892b0'
    });
    close.setOrigin(0.5);

    overlay.on('pointerdown', () => {
      [overlay, panel, title, close].forEach(o => o.destroy());
    });
  }

  private showHelp(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1, 1), Phaser.Geom.Rectangle.Contains);

    const w = 620;
    const h = 480;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.hudBg, 0.98);
    panel.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 16);
    panel.lineStyle(2, COLORS.warning, 0.5);
    panel.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 16);

    const title = this.add.text(cx, cy - h / 2 + 40, '📖 操作说明', {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: '#ffd866',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const helpText = [
      '【游戏目标】',
      '在步数限制内，将所有目标书籍放回正确的书架位置',
      '',
      '【操作方式】',
      'WASD / 方向键 - 移动角色',
      '空格键 / E - 交互（收集线索、修复索引卡、取放书籍）',
      'Z - 撤销上一步操作',
      'R - 重新开始当前关卡',
      'ESC - 返回主菜单 / 暂停',
      '',
      '【游戏流程】',
      '1. 探索书店，📝收集线索了解书籍分类',
      '2. 修复📇索引卡（需要先收集对应线索）',
      '3. 推动📚书架打通道路',
      '4. 从书架拿起书籍，找到正确的目标书架放置',
      '5. 所有书籍正确归位即通关！',
      '',
      '【评分标准】',
      '步数越少、用时越短，获得星星越多（最多3星）'
    ];

    let textY = cy - h / 2 + 80;
    helpText.forEach(line => {
      const isHeader = line.startsWith('【');
      const t = this.add.text(cx - w / 2 + 40, textY, line, {
        fontFamily: 'monospace',
        fontSize: isHeader ? '15px' : '12px',
        color: isHeader ? '#7aa2f7' : '#8892b0',
        fontStyle: isHeader ? 'bold' : 'normal',
        wordWrap: { width: w - 80 }
      });
      t.setOrigin(0, 0);
      textY += isHeader ? 26 : 18;
    });

    const close = this.add.text(cx, cy + h / 2 - 30, '点击任意处关闭', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#8892b0'
    });
    close.setOrigin(0.5);

    overlay.on('pointerdown', () => {
      [overlay, panel, title, close].forEach(o => o.destroy());
    });
  }

  private confirmReset(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1, 1), Phaser.Geom.Rectangle.Contains);

    const w = 400;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.hudBg, 0.98);
    panel.fillRoundedRect(cx - w / 2, cy - 120, w, 240, 14);
    panel.lineStyle(2, COLORS.error, 0.6);
    panel.strokeRoundedRect(cx - w / 2, cy - 120, w, 240, 14);

    const title = this.add.text(cx, cy - 80, '⚠ 确认重置', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ff6b6b',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const msg = this.add.text(cx, cy - 30, '将清除所有关卡进度和自定义关卡，\n此操作无法撤销。', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8892b0',
      align: 'center'
    });
    msg.setOrigin(0.5);

    const confirmBg = this.add.graphics();
    confirmBg.fillStyle(COLORS.error, 0.9);
    confirmBg.fillRoundedRect(cx - 150, cy + 40, 120, 40, 8);
    confirmBg.setInteractive(new Phaser.Geom.Rectangle(cx - 150, cy + 40, 120, 40), Phaser.Geom.Rectangle.Contains);
    confirmBg.on('pointerdown', () => {
      saveSystem.resetProgress();
      audioSystem.play('notification');
      this.scene.restart();
    });

    const confirmText = this.add.text(cx - 90, cy + 60, '确认重置', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff'
    });
    confirmText.setOrigin(0.5);

    const cancelBg = this.add.graphics();
    cancelBg.fillStyle(COLORS.hudBorder, 0.9);
    cancelBg.fillRoundedRect(cx + 30, cy + 40, 120, 40, 8);
    cancelBg.setInteractive(new Phaser.Geom.Rectangle(cx + 30, cy + 40, 120, 40), Phaser.Geom.Rectangle.Contains);
    cancelBg.on('pointerdown', () => {
      [overlay, panel, title, msg, confirmBg, confirmText, cancelBg, this.add.text(cx + 90, cy + 60, '取消', { fontFamily: 'monospace', fontSize: '14px', color: '#e8e8f0' }).setOrigin(0.5)].forEach(o => o.destroy());
    });

    const cancelText = this.add.text(cx + 90, cy + 60, '取消', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e8e8f0'
    });
    cancelText.setOrigin(0.5);
  }

  private startAmbient(): void {
    audioSystem.playAmbient();
  }

  private onResize(): void {
    this.scene.restart();
  }
}
