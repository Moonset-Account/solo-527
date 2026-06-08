import Phaser from 'phaser';

export class AssetLoader {
  static generateTextures(scene: Phaser.Scene): void {
    generateTrackTexture(scene);
    generateJunctionTexture(scene);
    generateSignalTexture(scene, 'signal_green', 0x2a9d8f);
    generateSignalTexture(scene, 'signal_red', 0xe63946);
    generatePlatformTexture(scene);
    generateTrainTexture(scene, 'train_passenger', 0x4a90d9);
    generateTrainTexture(scene, 'train_freight', 0xd97b4a);
    generateButtonTexture(scene, 'btn_primary', 0x2a9d8f, 0x1e7a6a);
    generateButtonTexture(scene, 'btn_danger', 0xe63946, 0xb82d38);
    generateButtonTexture(scene, 'btn_neutral', 0x4a5568, 0x374151);
    generatePanelTexture(scene);
    generateStarTexture(scene, 'star_filled', 0xfbbf24);
    generateStarTexture(scene, 'star_empty', 0x4a5568);
    generateTrainHeadTexture(scene);
  }
}

function generateTrackTexture(scene: Phaser.Scene): void {
  const g = new Phaser.GameObjects.Graphics(scene);
  g.fillStyle(0x6c757d);
  g.fillRect(0, 0, 64, 8);
  g.lineStyle(1, 0xadb5bd);
  for (let x = 4; x < 64; x += 12) {
    g.lineBetween(x, 0, x, 8);
  }
  g.generateTexture('track_h', 64, 8);
  g.destroy();

  const g2 = new Phaser.GameObjects.Graphics(scene);
  g2.fillStyle(0x6c757d);
  g2.fillRect(0, 0, 8, 64);
  g2.lineStyle(1, 0xadb5bd);
  for (let y = 4; y < 64; y += 12) {
    g2.lineBetween(0, y, 8, y);
  }
  g2.generateTexture('track_v', 8, 64);
  g2.destroy();

  const g3 = new Phaser.GameObjects.Graphics(scene);
  g3.fillStyle(0x6c757d);
  g3.lineStyle(6, 0x6c757d);
  g3.beginPath();
  g3.arc(32, 32, 32, 0, Math.PI / 2, false);
  g3.strokePath();
  g3.generateTexture('track_curve', 64, 64);
  g3.destroy();
}

function generateJunctionTexture(scene: Phaser.Scene): void {
  const g = new Phaser.GameObjects.Graphics(scene);
  g.fillStyle(0xfbbf24);
  g.fillCircle(16, 16, 14);
  g.lineStyle(2, 0x92400e);
  g.strokeCircle(16, 16, 14);
  g.fillStyle(0x92400e);
  g.fillRect(10, 6, 4, 8);
  g.fillRect(10, 6, 12, 4);
  g.generateTexture('junction', 32, 32);
  g.destroy();
}

function generateSignalTexture(scene: Phaser.Scene, key: string, color: number): void {
  const g = new Phaser.GameObjects.Graphics(scene);
  g.fillStyle(0x374151);
  g.fillRoundedRect(2, 2, 20, 36, 4);
  g.fillStyle(color);
  g.fillCircle(12, 12, 7);
  g.lineStyle(2, 0x1f2937);
  g.strokeCircle(12, 12, 7);
  g.generateTexture(key, 24, 40);
  g.destroy();
}

function generatePlatformTexture(scene: Phaser.Scene): void {
  const g = new Phaser.GameObjects.Graphics(scene);
  g.fillStyle(0x8b5cf6);
  g.fillRoundedRect(0, 0, 80, 24, 4);
  g.lineStyle(2, 0x6d28d9);
  g.strokeRoundedRect(0, 0, 80, 24, 4);
  g.fillStyle(0xe0e7ff);
  g.fillRect(8, 8, 64, 8);
  g.generateTexture('platform', 80, 24);
  g.destroy();
}

function generateTrainTexture(scene: Phaser.Scene, key: string, color: number): void {
  const g = new Phaser.GameObjects.Graphics(scene);
  g.fillStyle(color);
  g.fillRoundedRect(2, 2, 44, 20, 6);
  g.lineStyle(2, 0x1f2937);
  g.strokeRoundedRect(2, 2, 44, 20, 6);
  g.fillStyle(0xe0e7ff);
  g.fillRect(36, 6, 8, 12);
  g.fillStyle(0xffffff, 0.8);
  g.fillRect(6, 8, 4, 8);
  g.fillRect(14, 8, 4, 8);
  g.fillRect(22, 8, 4, 8);
  g.generateTexture(key, 48, 24);
  g.destroy();
}

function generateTrainHeadTexture(scene: Phaser.Scene): void {
  const g = new Phaser.GameObjects.Graphics(scene);
  g.fillStyle(0xfbbf24, 0.8);
  g.fillCircle(6, 6, 6);
  g.generateTexture('train_head', 12, 12);
  g.destroy();
}

function generateButtonTexture(scene: Phaser.Scene, key: string, color: number, darkColor: number): void {
  const g = new Phaser.GameObjects.Graphics(scene);
  g.fillStyle(darkColor);
  g.fillRoundedRect(0, 4, 200, 48, 8);
  g.fillStyle(color);
  g.fillRoundedRect(0, 0, 200, 44, 8);
  g.generateTexture(key, 200, 52);
  g.destroy();
}

function generatePanelTexture(scene: Phaser.Scene): void {
  const g = new Phaser.GameObjects.Graphics(scene);
  g.fillStyle(0x1e293b, 0.9);
  g.fillRoundedRect(0, 0, 400, 300, 12);
  g.lineStyle(2, 0x475569);
  g.strokeRoundedRect(0, 0, 400, 300, 12);
  g.generateTexture('panel', 400, 300);
  g.destroy();
}

function generateStarTexture(scene: Phaser.Scene, key: string, color: number): void {
  const g = new Phaser.GameObjects.Graphics(scene);
  g.fillStyle(color);
  g.beginPath();
  const cx = 16, cy = 16, outerR = 14, innerR = 6;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
  g.generateTexture(key, 32, 32);
  g.destroy();
}
