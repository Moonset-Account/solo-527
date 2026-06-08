export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getTrainDisplayName(type: 'passenger' | 'freight', name: string): string {
  const prefix = type === 'passenger' ? 'K' : 'G';
  return `${prefix}${name}`;
}

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  textureKey: string,
  callback: () => void
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const bg = scene.add.image(0, 0, textureKey);
  const label = scene.add.text(0, -2, text, {
    fontSize: '20px',
    fontFamily: '"Courier New", monospace',
    color: '#ffffff',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  container.add([bg, label]);
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerover', () => bg.setTint(0xdddddd));
  bg.on('pointerout', () => bg.clearTint());
  bg.on('pointerdown', () => {
    bg.setScale(0.95);
    scene.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 100 });
    callback();
  });
  return container;
}

export function shakeScreen(scene: Phaser.Scene, intensity: number = 5, duration: number = 200): void {
  scene.cameras.main.shake(duration, intensity / 100);
}

export function flashScreen(scene: Phaser.Scene, color: number = 0xff0000, alpha: number = 0.3, duration: number = 300): void {
  const rect = scene.add.rectangle(
    scene.cameras.main.centerX,
    scene.cameras.main.centerY,
    scene.cameras.main.width,
    scene.cameras.main.height,
    color,
    alpha
  ).setDepth(1000).setScrollFactor(0);
  scene.tweens.add({
    targets: rect,
    alpha: 0,
    duration,
    onComplete: () => rect.destroy(),
  });
}
