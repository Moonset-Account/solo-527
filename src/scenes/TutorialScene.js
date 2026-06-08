import { BaseScene } from './BaseScene.js';
import { SCENES } from '../core/SceneManager.js';

const TUTORIAL_STEPS = [
  {
    title: '欢迎来到信号灯模拟',
    icon: '👋',
    content: `你是一名交通信号工程师。你的任务是通过调整红绿灯周期和公交优先规则，
    让城市的早晚高峰更顺畅。每一关都有三个星级目标，达到目标即可过关。`,
    tips: [
      '拥堵指数超过阈值持续太久会直接失败',
      '三颗星是最高评价，挑战它！',
      '仔细观察车流，动态调整参数'
    ]
  },
  {
    title: '信号灯周期',
    icon: '🚦',
    content: '每个路口可以设置：',
    tips: [
      '📌 周期：完整的一轮信号灯（30-120秒）',
      '📌 南北绿灯比例：南北方向绿灯占比（20%-75%）',
      '📌 黄灯时间：过渡信号（2-6秒）',
      '💡 长周期减少频繁启停，但可能让一方等待太久'
    ]
  },
  {
    title: '公交优先与特殊规则',
    icon: '🚌',
    content: '开启公交优先后，信号灯会在公交车接近时给予绿灯。',
    tips: [
      '🚍 公交优先：检测到公交车接近时自动延长绿灯或变绿',
      '↪️ 红灯右转：开启后车辆可在红灯时安全右转',
      '💡 公交准点率是评分重要指标之一'
    ]
  },
  {
    title: '早晚高峰',
    icon: '⏰',
    content: '每一关都会模拟早晚高峰时段，车流量会显著增加。',
    tips: [
      '🌅 早高峰：通常从 15-45 秒左右开始',
      '🌇 晚高峰：通常从 75-105 秒左右开始（因关卡而异）',
      '💡 高峰时段是关键考验，提前调整参数！'
    ]
  },
  {
    title: '操作与控制',
    icon: '🎮',
    content: '使用以下快捷键和控件：',
    tips: [
      '⌨️ 空格：暂停 / 继续',
      '⌨️ 1-5：设置游戏速度倍率',
      '⌨️ R：重放最后一段数据',
      '🖱️ 滚轮：缩放视角',
      '💡 调整参数后立即生效，可实时观察效果'
    ]
  },
  {
    title: '评价与结算',
    icon: '🏆',
    content: '最终评分由三项指标决定：',
    tips: [
      '🚗 平均速度（km/h）：越高越好',
      '📊 拥堵指数（%）：越低越好',
      '🚌 公交准点率（%）：越高越好',
      '💡 每项都有三星标准，均衡优化才能拿满分！'
    ]
  }
];

export class TutorialScene extends BaseScene {
  _setupUI() {
    this.currentStep = 0;
    this.totalSteps = TUTORIAL_STEPS.length;
    this._renderModal();
  }

  _renderModal() {
    this._clearUI();
    const step = TUTORIAL_STEPS[this.currentStep];

    const overlay = this._createElement('div', 'modal-overlay');
    const modal = this._createElement('div', 'panel modal');

    const dots = this._createElement('div', 'tutorial-progress');
    for (let i = 0; i < this.totalSteps; i++) {
      const dot = this._createElement('div', `tutorial-dot ${i === this.currentStep ? 'active' : ''}`);
      dots.appendChild(dot);
    }

    const title = this._h('h2', { textContent: step.title });

    const body = this._h('div', { className: 'modal-body' });

    const stepBox = this._h('div', { className: 'tutorial-step' }, [
      this._h('div', { className: 'tutorial-icon', textContent: step.icon }),
      this._h('div', { style: { flex: 1 } }, [
        this._h('p', { style: { whiteSpace: 'pre-wrap', marginBottom: '12px' }, textContent: step.content }),
        this._h('ul', { style: { listStyle: 'none', padding: 0 } },
          step.tips.map((tip) =>
            this._h('li', { style: { padding: '6px 0', fontSize: '14px', lineHeight: '1.6' }, textContent: tip })
          )
        )
      ])
    ]);

    body.appendChild(stepBox);

    const footer = this._h('div', { className: 'modal-footer' });
    if (this.currentStep > 0) {
      const prev = this._h('button', {
        className: 'btn btn-secondary',
        textContent: '← 上一步',
        onclick: () => {
          this.audioManager.playClick();
          this.currentStep--;
          this._renderModal();
        }
      });
      footer.appendChild(prev);
    }
    const stepIndicator = this._h('span', {
      style: { alignSelf: 'center', color: '#8a9ab5', fontSize: '14px', marginLeft: '12px', marginRight: 'auto' },
      textContent: `${this.currentStep + 1} / ${this.totalSteps}`
    });
    footer.appendChild(stepIndicator);

    if (this.currentStep < this.totalSteps - 1) {
      const next = this._h('button', {
        className: 'btn',
        textContent: '下一步 →',
        onclick: () => {
          this.audioManager.playClick();
          this.currentStep++;
          this._renderModal();
        }
      });
      footer.appendChild(next);
    } else {
      const start = this._h('button', {
        className: 'btn btn-success btn-large',
        textContent: '🚀 开始挑战',
        onclick: () => {
          this.audioManager.playClick();
          this.sceneManager.changeTo(SCENES.LEVEL_SELECT);
        }
      });
      footer.appendChild(start);
    }

    modal.appendChild(dots);
    modal.appendChild(title);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    this._mountUI(overlay);
  }

  _bindEvents() {
    this._onEscape = () => {
      this.audioManager.playClick();
      this.sceneManager.changeTo(SCENES.MENU);
    };
    this.eventBus.on('input:action:escape', this._onEscape);
  }

  _unbindEvents() {
    super._unbindEvents();
    if (this._onEscape) this.eventBus.off('input:action:escape', this._onEscape);
  }
}
