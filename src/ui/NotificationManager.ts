import Phaser from 'phaser';
import { NotificationData } from '@core/types';
import { COLORS } from '@config/constants';
import { eventBus, GameEvents } from '@core/EventBus';

interface NotificationItem {
  data: NotificationData;
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  created: number;
}

export class NotificationManager {
  private scene: Phaser.Scene;
  private notifications: NotificationItem[] = [];
  private maxNotifications: number = 5;
  private padding: number = 12;
  private eventListenerId: number | null = null;
  private baseY: number = 80;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupEventBus();
  }

  private setupEventBus(): void {
    this.eventListenerId = eventBus.on(GameEvents.NOTIFICATION, (data: NotificationData) => {
      this.show(data);
    });
  }

  show(data: NotificationData): void {
    if (this.notifications.length >= this.maxNotifications) {
      this.removeOldest();
    }

    this.createNotification(data);
    this.rearrange();
  }

  private createNotification(data: NotificationData): void {
    const width = 360;
    const height = 48;
    const x = this.scene.scale.width / 2;
    const y = this.baseY;

    const container = this.scene.add.container(x, -height);
    container.setDepth(500);

    const bg = this.scene.add.graphics();
    const colors: Record<NotificationData['type'], { bg: number; border: number; text: string }> = {
      info: { bg: COLORS.hudBg, border: COLORS.accent, text: '#e8e8f0' },
      success: { bg: 0x1e2e1e, border: COLORS.success, text: '#98c379' },
      warning: { bg: 0x2e2e1e, border: COLORS.warning, text: '#ffd866' },
      error: { bg: 0x2e1e1e, border: COLORS.error, text: '#ff6b6b' }
    };
    const scheme = colors[data.type];

    bg.fillStyle(scheme.bg, 0.95);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    bg.lineStyle(2, scheme.border, 0.9);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);

    const iconMap: Record<NotificationData['type'], string> = {
      info: 'ℹ',
      success: '✓',
      warning: '!',
      error: '✕'
    };

    const iconText = this.scene.add.text(-width / 2 + 24, 0, iconMap[data.type], {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: scheme.text
    });
    iconText.setOrigin(0, 0.5);

    const text = this.scene.add.text(-width / 2 + 56, 0, data.message, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: scheme.text,
      wordWrap: { width: width - 80 }
    });
    text.setOrigin(0, 0.5);

    container.add([bg, iconText, text]);

    const item: NotificationItem = {
      data,
      container,
      bg,
      text,
      created: Date.now()
    };

    this.notifications.unshift(item);

    this.scene.tweens.add({
      targets: container,
      y: y,
      duration: 300,
      ease: 'Back.easeOut'
    });

    const duration = data.duration || 3000;
    this.scene.time.delayedCall(duration, () => {
      this.remove(item);
    });
  }

  private rearrange(): void {
    const height = 48 + this.padding;
    this.notifications.forEach((item, index) => {
      const targetY = this.baseY + index * height;
      this.scene.tweens.add({
        targets: item.container,
        y: targetY,
        duration: 200,
        ease: 'Cubic.easeOut'
      });
    });
  }

  private remove(item: NotificationItem): void {
    const idx = this.notifications.indexOf(item);
    if (idx === -1) return;

    this.scene.tweens.add({
      targets: item.container,
      y: -100,
      alpha: 0,
      duration: 250,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        item.container.destroy();
        const removeIdx = this.notifications.indexOf(item);
        if (removeIdx !== -1) {
          this.notifications.splice(removeIdx, 1);
          this.rearrange();
        }
      }
    });
  }

  private removeOldest(): void {
    if (this.notifications.length === 0) return;
    const oldest = this.notifications[this.notifications.length - 1];
    this.remove(oldest);
  }

  clearAll(): void {
    [...this.notifications].forEach(item => this.remove(item));
  }

  destroy(): void {
    if (this.eventListenerId !== null) {
      eventBus.off(GameEvents.NOTIFICATION, this.eventListenerId);
    }
    this.clearAll();
  }

  updatePosition(): void {
    this.baseY = 80;
    this.rearrange();
  }
}
