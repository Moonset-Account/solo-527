import { Game } from './core/Game.js';

const game = new Game();
game.init().then(() => {
  console.log('🚦 城市路口信号灯模拟系统已启动');
});

window.game = game;
