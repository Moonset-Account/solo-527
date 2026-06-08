import Phaser from 'phaser';
import { AssetLoader } from '../core/AssetLoader.js';
import { generateAllAudio } from '../core/AudioGenerator.js';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    AssetLoader.generateTextures(this);
    generateAllAudio().then(buffers => {
      for (const [key, buf] of Object.entries(buffers)) {
        this.cache.audio.add(key, buf);
      }
      this.scene.start('MenuScene');
    });
  }
}
