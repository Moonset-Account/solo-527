import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig.js';

const config = createGameConfig();
const game = new Phaser.Game(config);
