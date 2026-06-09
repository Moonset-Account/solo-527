import { Game } from './game/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Game canvas not found');
}

const game = new Game(canvas);
game.start();

(window as any).__TEA_GARDEN_TD__ = game;
