import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { ClueBoardScene } from './scenes/ClueBoardScene';
import { ResultScene } from './scenes/ResultScene';

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: document.body,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
    touch: {
      capture: true,
    },
  },
  scene: [BootScene, MenuScene, GameScene, ClueBoardScene, ResultScene],
};
