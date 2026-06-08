import Phaser from 'phaser';
import { GAME_CONFIG } from './config/GameConfig.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import TutorialScene from './scenes/TutorialScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import GameScene from './scenes/GameScene.js';
import ResultScene from './scenes/ResultScene.js';
import ReplayScene from './scenes/ReplayScene.js';
import { EventBus } from './systems/EventBus.js';
import { SaveSystem } from './systems/SaveSystem.js';

class GameBoot {
  constructor() {
    this.init();
  }

  init() {
    window.EventBus = EventBus;
    window.SaveSystem = new SaveSystem();
    window.SaveSystem.init();

    const config = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: GAME_CONFIG.width,
      height: GAME_CONFIG.height,
      backgroundColor: GAME_CONFIG.backgroundColor,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_CONFIG.width,
        height: GAME_CONFIG.height
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: GAME_CONFIG.debugPhysics
        }
      },
      scene: [
        BootScene,
        MenuScene,
        TutorialScene,
        LevelSelectScene,
        GameScene,
        ResultScene,
        ReplayScene
      ]
    };

    window.game = new Phaser.Game(config);

    window.addEventListener('resize', () => {
      if (window.game && window.game.scale) {
        window.game.scale.refresh();
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GameBoot();
});
