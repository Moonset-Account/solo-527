import { BaseScene } from './BaseScene.js';
import { SCENES } from '../core/SceneManager.js';

export class BootScene extends BaseScene {
  async onEnter(params) {
    await super.onEnter(params);
    this.sceneManager.changeTo(SCENES.LOADING, { nextScene: SCENES.MENU });
  }
}
