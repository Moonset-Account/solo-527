import Phaser from 'phaser';
import { BootScene } from '@/scenes/BootScene';
import { MainMenuScene } from '@/scenes/MainMenuScene';
import { TutorialScene } from '@/scenes/TutorialScene';
import { LevelSelectScene } from '@/scenes/LevelSelectScene';
import { GameScene } from '@/scenes/GameScene';
import { PauseScene } from '@/scenes/PauseScene';
import { SettingsScene } from '@/scenes/SettingsScene';
import { ResultScene } from '@/scenes/ResultScene';
import { EditorScene } from '@/scenes/EditorScene';
import { DebugScene } from '@/scenes/DebugScene';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;
export const TILE_SIZE = 48;

export const COLORS = {
  bg: 0x1a1a2e,
  bgLight: 0x16213e,
  accent: 0xe6a817,
  accentDark: 0xb8860b,
  text: 0xf0e6d3,
  textDark: 0x3d2b1f,
  panel: 0x0f3460,
  panelLight: 0x1a4080,
  success: 0x4ade80,
  failure: 0xef4444,
  clue: 0x60a5fa,
  indexCard: 0xfbbf24,
  wall: 0x3d2b1f,
  floor: 0x2a2a4a,
  shelfSlot: 0x5c3d2e,
  bookshelf: 0x6b3a2a,
  book: 0xe6a817,
  player: 0x60a5fa,
};

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS.bg,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
      BootScene,
      MainMenuScene,
      TutorialScene,
      LevelSelectScene,
      GameScene,
      PauseScene,
      SettingsScene,
      ResultScene,
      EditorScene,
      DebugScene,
    ],
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
      },
    },
    input: {
      keyboard: true,
      gamepad: true,
    },
    audio: {
      disableWebAudio: false,
    },
  };
}
