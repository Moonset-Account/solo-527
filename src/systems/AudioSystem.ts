import Phaser from 'phaser';
import { SaveSystem } from './SaveSystem';

export class AudioSystem {
  private scene: Phaser.Scene;
  private saveSystem: SaveSystem;
  private bgm: Phaser.Sound.BaseSound | null = null;

  constructor(scene: Phaser.Scene, saveSystem: SaveSystem) {
    this.scene = scene;
    this.saveSystem = saveSystem;
  }

  playSfx(key: string): void {
    if (!this.scene.sound || !this.scene.cache.audio.exists(key)) return;
    const settings = this.saveSystem.getSettings();
    if (settings.sfxVolume <= 0 || settings.masterVolume <= 0) return;
    try {
      (this.scene.sound as Phaser.Sound.WebAudioSoundManager).play(key, {
        volume: settings.sfxVolume * settings.masterVolume,
      });
    } catch (e) {
      // silent fail for audio
    }
  }

  playBgm(key: string): void {
    this.stopBgm();
    if (!this.scene.sound || !this.scene.cache.audio.exists(key)) return;
    const settings = this.saveSystem.getSettings();
    try {
      this.bgm = this.scene.sound.add(key, {
        loop: true,
        volume: settings.bgmVolume * settings.masterVolume,
      });
      this.bgm.play();
    } catch (e) {
      // silent fail
    }
  }

  stopBgm(): void {
    if (this.bgm && this.bgm.isPlaying) {
      this.bgm.stop();
    }
    this.bgm = null;
  }

  updateVolumes(): void {
    const settings = this.saveSystem.getSettings();
    if (this.bgm && 'setVolume' in this.bgm) {
      (this.bgm as Phaser.Sound.WebAudioSound).setVolume(settings.bgmVolume * settings.masterVolume);
    }
  }
}
