import Phaser from 'phaser';
import { createGameConfig } from '@/config/GameConfig';

const config = createGameConfig();
const game = new Phaser.Game(config);

if (import.meta.env.DEV) {
  (window as any).__game = game;
}

export default game;
