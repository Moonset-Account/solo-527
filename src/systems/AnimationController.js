import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig.js';

export class AnimationController {
  constructor(scene) {
    this.scene = scene;
    this.tweens = [];
    this.timelines = [];
    this.runningAnimations = new Map();
  }

  tween(config) {
    const tween = this.scene.tweens.add(config);
    this.tweens.push(tween);
    return tween;
  }

  timeline(config) {
    const timeline = this.scene.tweens.createTimeline(config);
    this.timelines.push(timeline);
    return timeline;
  }

  fadeIn(target, duration = 300, from = 0, to = 1, delay = 0) {
    target.alpha = from;
    return this.tween({
      targets: target,
      alpha: to,
      duration,
      delay,
      ease: 'Power2'
    });
  }

  fadeOut(target, duration = 300, to = 0, delay = 0) {
    return this.tween({
      targets: target,
      alpha: to,
      duration,
      delay,
      ease: 'Power2'
    });
  }

  popIn(target, duration = 400, scale = 1, delay = 0) {
    target.setScale(0);
    target.setVisible(true);
    return this.tween({
      targets: target,
      scale: scale,
      duration,
      delay,
      ease: 'Back.easeOut'
    });
  }

  popOut(target, duration = 300, delay = 0, onComplete = null) {
    return this.tween({
      targets: target,
      scale: 0,
      duration,
      delay,
      ease: 'Back.easeIn',
      onComplete: () => {
        target.setVisible(false);
        if (onComplete && typeof onComplete === 'function') {
          onComplete();
        }
      }
    });
  }

  slideIn(target, direction = 'left', duration = 500, offset = 100, delay = 0) {
    const origX = target.x;
    const origY = target.y;
    let startX = origX;
    let startY = origY;

    switch (direction) {
      case 'left':
        startX = origX - offset;
        break;
      case 'right':
        startX = origX + offset;
        break;
      case 'up':
        startY = origY - offset;
        break;
      case 'down':
        startY = origY + offset;
        break;
    }

    target.setPosition(startX, startY);
    target.setVisible(true);
    return this.tween({
      targets: target,
      x: origX,
      y: origY,
      duration,
      delay,
      ease: 'Cubic.easeOut'
    });
  }

  slideOut(target, direction = 'right', duration = 400, offset = 100, delay = 0, onComplete = null) {
    let endX = target.x;
    let endY = target.y;

    switch (direction) {
      case 'left':
        endX = target.x - offset;
        break;
      case 'right':
        endX = target.x + offset;
        break;
      case 'up':
        endY = target.y - offset;
        break;
      case 'down':
        endY = target.y + offset;
        break;
    }

    return this.tween({
      targets: target,
      x: endX,
      y: endY,
      duration,
      delay,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        if (onComplete && typeof onComplete === 'function') {
          onComplete();
        }
      }
    });
  }

  shake(target, intensity = 5, duration = 300, delay = 0) {
    const origX = target.x;
    const origY = target.y;

    return this.tween({
      targets: target,
      x: origX + (Math.random() * intensity * 2 - intensity),
      y: origY + (Math.random() * intensity * 2 - intensity),
      duration: duration / 4,
      delay,
      ease: 'Linear',
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        target.setPosition(origX, origY);
      }
    });
  }

  pulse(target, scaleFrom = 1, scaleTo = 1.1, duration = 600, repeat = -1, delay = 0) {
    target.setScale(scaleFrom);
    return this.tween({
      targets: target,
      scale: scaleTo,
      duration: duration / 2,
      delay,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat
    });
  }

  glow(target, color = 0xffffff, duration = 500, delay = 0) {
    return this.tween({
      targets: target,
      tint: { from: 0xffffff, to: color },
      duration,
      delay,
      ease: 'Linear',
      yoyo: true,
      repeat: 0
    });
  }

  flashRect(x, y, width, height, color = 0x4a9eff, alpha = 0.5, duration = 600) {
    const rect = this.scene.add.rectangle(x, y, width, height, color, alpha);
    rect.setOrigin(0.5);

    this.tween({
      targets: rect,
      alpha: 0,
      scale: 1.5,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        rect.destroy();
      }
    });

    return rect;
  }

  particles(x, y, config = {}) {
    const defaultConfig = {
      speed: { min: 50, max: 150 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 10,
      ...config
    };

    return this.scene.add.particles(x, y, null, defaultConfig);
  }

  createConfetti(x, y, count = 30) {
    const colors = [0x4a9eff, 0xff6b6b, 0x4ecdc4, 0xffd93d, 0xa29bfe];
    const particles = [];

    for (let i = 0; i < count; i++) {
      const particle = this.scene.add.circle(
        x + (Math.random() - 0.5) * 100,
        y,
        4 + Math.random() * 6,
        Phaser.Utils.Array.GetRandom(colors)
      );

      const targetX = x + (Math.random() - 0.5) * 400;
      const targetY = y + 100 + Math.random() * 300;

      this.tween({
        targets: particle,
        x: targetX,
        y: targetY,
        angle: Math.random() * 720 - 360,
        alpha: 0,
        duration: 1000 + Math.random() * 500,
        delay: Math.random() * 200,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          particle.destroy();
        }
      });

      particles.push(particle);
    }

    return particles;
  }

  starBurst(x, y, color = 0x4a9eff, count = 8, radius = 80) {
    const lines = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const endX = x + Math.cos(angle) * radius;
      const endY = y + Math.sin(angle) * radius;

      const line = this.scene.add.line(0, 0, x, y, endX, endY, color, 1);
      line.setLineWidth(3);
      line.setOrigin(0);
      lines.push(line);

      this.tween({
        targets: line,
        alpha: 0,
        scale: 1.5,
        duration: 500,
        delay: i * 20,
        ease: 'Cubic.easeOut',
        onComplete: () => line.destroy()
      });
    }
    return lines;
  }

  counterText(x, y, text, color = '#4ecdc4', duration = 800) {
    const txt = this.scene.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '32px',
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 4
    });
    txt.setOrigin(0.5);

    this.tween({
      targets: txt,
      y: y - 80,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy()
    });

    return txt;
  }

  screenFlash(color = 0xffffff, alpha = 0.3, duration = 200) {
    const { width, height } = this.scene.scale;
    const flash = this.scene.add.rectangle(width / 2, height / 2, width, height, color, alpha);
    flash.setDepth(9999);

    this.tween({
      targets: flash,
      alpha: 0,
      duration,
      ease: 'Linear',
      onComplete: () => flash.destroy()
    });

    return flash;
  }

  pause(target, delay = 0, onComplete = null) {
    this.scene.time.delayedCall(delay, () => {
      if (onComplete && typeof onComplete === 'function') {
        onComplete();
      }
    });
  }

  clear() {
    this.tweens.forEach(t => {
      try { t.stop(); } catch (e) { }
    });
    this.timelines.forEach(t => {
      try { t.stop(); } catch (e) { }
    });
    this.tweens = [];
    this.timelines = [];
    this.runningAnimations.clear();
  }

  destroy() {
    this.clear();
  }
}
