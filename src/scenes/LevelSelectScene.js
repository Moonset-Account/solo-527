import { BaseScene } from './BaseScene.js';
import { SCENES } from '../core/SceneManager.js';
import { listLevels, getDifficultyStars } from '../data/levels.js';

export class LevelSelectScene extends BaseScene {
  _setupUI() {
    const panel = this._createElement('div', 'panel level-select');

    const header = this._h('div', { className: 'level-header' }, [
      this._h('h2', { textContent: '📍 选择关卡' }),
      this._h('button', {
        className: 'btn btn-secondary',
        textContent: '← 返回',
        onclick: () => {
          this.audioManager.playClick();
          this.sceneManager.changeTo(SCENES.MENU);
        }
      })
    ]);

    const grid = this._createElement('div', 'level-grid');

    const levels = listLevels();
    levels.forEach((level) => {
      const unlocked = this.saveSystem.isLevelUnlocked(level.id);
      const stars = this.saveSystem.getLevelStars(level.id);
      const completed = stars > 0;

      const card = this._h('div', {
        className: `level-card ${!unlocked ? 'locked' : ''} ${completed ? 'completed' : ''}`,
        onclick: () => {
          if (!unlocked) {
            this._showToast('🔒 请先完成前置关卡', 'warning');
            return;
          }
          this.audioManager.playClick();
          this.sceneManager.changeTo(SCENES.GAME, { levelId: level.id });
        }
      }, [
        this._h('h3', { textContent: level.name }),
        this._h('div', {
          className: 'level-desc',
          textContent: unlocked
            ? level.description
            : '🔒 完成前置关卡后解锁'
        }),
        this._h('div', { textContent: `难度: ${getDifficultyStars(level.difficulty)}`,
          style: { fontSize: '14px', color: '#ffa94d', marginBottom: '8px', letterSpacing: '2px' }
        }),
        this._h('div', { className: 'stars',
          textContent: '★'.repeat(stars) + '☆'.repeat(3 - stars)
        })
      ]);
      grid.appendChild(card);
    });

    panel.appendChild(header);
    panel.appendChild(grid);
    this._mountUI(panel);
  }
}
