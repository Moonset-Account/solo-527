import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';
import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { MenuScene } from '@/scenes/MenuScene';
import { GameScene } from '@/scenes/GameScene';
import { PauseScene } from '@/scenes/PauseScene';
import { CompleteScene } from '@/scenes/CompleteScene';
import { LevelSelectScene } from '@/scenes/LevelSelectScene';
import { SettingsScene } from '@/scenes/SettingsScene';
import { AchievementsScene } from '@/scenes/AchievementsScene';
import { LeaderboardScene } from '@/scenes/LeaderboardScene';
import { EditorScene } from '@/scenes/EditorScene';

const config: Phaser.Types.Core.GameConfig = {
  parent: 'game-container',
  type: Phaser.AUTO,
  backgroundColor: '#0f0d1a',
  scene: [BootScene, PreloadScene, MenuScene, GameScene, PauseScene, CompleteScene, LevelSelectScene, SettingsScene, AchievementsScene, LeaderboardScene, EditorScene],
  input: {
    gamepad: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GameConfig.CANVAS_WIDTH,
    height: GameConfig.CANVAS_HEIGHT
  }
};

new Phaser.Game(config);
