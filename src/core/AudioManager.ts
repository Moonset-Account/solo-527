import Phaser from 'phaser';

export class AudioManager {
  private scene: Phaser.Scene;
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private currentMusic?: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setMusicVolume(v: number): void {
    this.musicVolume = Phaser.Math.Clamp(v, 0, 1);
    if (this.currentMusic && 'setVolume' in this.currentMusic) {
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(this.musicVolume);
    }
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = Phaser.Math.Clamp(v, 0, 1);
  }

  playSfx(key: string): void {
    if (this.scene.cache.audio.has(key)) {
      this.scene.sound.play(key, { volume: this.sfxVolume });
    }
  }

  playMusic(key: string): void {
    this.stopMusic();
    if (this.scene.cache.audio.has(key)) {
      this.currentMusic = this.scene.sound.add(key, { volume: this.musicVolume, loop: true });
      this.currentMusic.play();
    }
  }

  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = undefined;
    }
  }

  playClick(): void { this.playSfx('click'); }
  playSwitch(): void { this.playSfx('switch'); }
  playSignal(): void { this.playSfx('signal'); }
  playAlert(): void { this.playSfx('alert'); }
  playSuccess(): void { this.playSfx('success'); }
  playFail(): void { this.playSfx('fail'); }
  playTrainHorn(): void { this.playSfx('train_horn'); }
  playTrainArrive(): void { this.playSfx('train_arrive'); }
}
