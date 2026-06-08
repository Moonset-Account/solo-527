import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/config/GameConfig';

interface TutorialStep {
  title: string;
  text: string;
  highlight?: string;
}

const STEPS: TutorialStep[] = [
  { title: '欢迎来到夜间书店', text: '闭店后，书店里一片混乱……\n你的任务是整理所有放错的书。', highlight: undefined },
  { title: '移动角色', text: '使用 WASD 或 方向键 移动。\n手柄可以用 左摇杆 或 方向键。', highlight: 'move' },
  { title: '推书架', text: '走向书架可以推动它。\n注意：书架只能向前推，不能拉回！\n确保前方有空间。', highlight: 'push' },
  { title: '收集线索', text: '蓝色问号是线索。\n走到线索上即可收集，\n线索会告诉你书应该放在哪。', highlight: 'clue' },
  { title: '修复索引卡', text: '索引卡标示了书的正确位置。\n把书推到索引卡附近即可修复。', highlight: 'index' },
  { title: '限步挑战', text: '每关有步数限制！\n超过限制则挑战失败。\n善用每一步。', highlight: 'steps' },
  { title: '准备开始', text: '现在试试教程关卡吧！\n按 回车 或点击"开始"进入。', highlight: undefined },
];

export class TutorialScene extends Phaser.Scene {
  private currentStep: number = 0;
  private stepTexts: { title: Phaser.GameObjects.Text; body: Phaser.GameObjects.Text } | null = null;
  private demoContainer!: Phaser.GameObjects.Container;
  private canInteract: boolean = false;

  constructor() {
    super({ key: 'TutorialScene' });
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);

    this.add.rectangle(GAME_WIDTH / 2, 40, GAME_WIDTH, 50, COLORS.panel, 0.8);
    this.add.text(GAME_WIDTH / 2, 40, '教程', {
      fontSize: '24px', fontFamily: 'serif', color: '#e6a817',
    }).setOrigin(0.5);

    const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 500, 320, COLORS.panelLight, 0.9);
    panel.setStrokeStyle(2, COLORS.accent, 0.5);

    this.stepTexts = {
      title: this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 140, '', {
        fontSize: '22px', fontFamily: 'serif', color: '#e6a817',
      }).setOrigin(0.5),
      body: this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '', {
        fontSize: '16px', fontFamily: 'sans-serif', color: '#f0e6d3', align: 'center', lineSpacing: 8,
      }).setOrigin(0.5, 0),
    };

    this.demoContainer = this.add.container(GAME_WIDTH / 2 + 260, GAME_HEIGHT / 2 - 20);

    const prevBtn = this.add.text(GAME_WIDTH / 2 - 140, GAME_HEIGHT - 80, '< 上一页', {
      fontSize: '18px', fontFamily: 'sans-serif', color: '#f0e6d3',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    prevBtn.on('pointerdown', () => this.prevStep());

    const nextBtn = this.add.text(GAME_WIDTH / 2 + 140, GAME_HEIGHT - 80, '下一页 >', {
      fontSize: '18px', fontFamily: 'sans-serif', color: '#f0e6d3',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this.nextStep());

    const startBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '开始教程关卡', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#e6a817',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    startBtn.on('pointerdown', () => this.startTutorialLevel());
    startBtn.setVisible(false);
    this.registry.set('tutorialStartBtn', startBtn);

    const backBtn = this.add.text(60, GAME_HEIGHT - 30, '返回主菜单', {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#9ca3af',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-LEFT', () => this.prevStep());
      this.input.keyboard.on('keydown-RIGHT', () => this.nextStep());
      this.input.keyboard.on('keydown-ENTER', () => {
        if (this.currentStep === STEPS.length - 1) this.startTutorialLevel();
        else this.nextStep();
      });
      this.input.keyboard.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
    }

    this.showStep(0);
    this.time.delayedCall(300, () => { this.canInteract = true; });
  }

  private showStep(index: number): void {
    const step = STEPS[index];
    if (!step || !this.stepTexts) return;
    this.currentStep = index;

    this.stepTexts.title.setText(step.title);
    this.stepTexts.body.setText(step.text);

    this.demoContainer.removeAll(true);
    this.createDemo(step.highlight);

    const startBtn = this.registry.get('tutorialStartBtn') as Phaser.GameObjects.Text;
    if (startBtn) startBtn.setVisible(index === STEPS.length - 1);
  }

  private createDemo(highlight?: string): void {
    if (!highlight) return;
    const s = 32;

    switch (highlight) {
      case 'move': {
        const player = this.add.rectangle(0, 0, s, s, COLORS.player);
        this.demoContainer.add(player);
        this.tweens.add({ targets: player, x: 40, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const arrow = this.add.text(30, -20, '→', { fontSize: '18px', color: '#e6a817' });
        this.demoContainer.add(arrow);
        break;
      }
      case 'push': {
        const shelf = this.add.rectangle(-30, 0, s, s, COLORS.bookshelf);
        const player2 = this.add.rectangle(-70, 0, s, s, COLORS.player);
        this.demoContainer.add([player2, shelf]);
        this.tweens.add({ targets: player2, x: -50, duration: 400, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: shelf, x: 10, duration: 400, yoyo: true, repeat: -1, delay: 100 });
        break;
      }
      case 'clue': {
        const clue = this.add.circle(0, 0, 14, COLORS.clue);
        const label = this.add.text(0, 0, '?', { fontSize: '16px', color: '#fff', fontFamily: 'sans-serif' }).setOrigin(0.5);
        this.demoContainer.add([clue, label]);
        this.tweens.add({ targets: [clue, label], alpha: { from: 1, to: 0.3 }, duration: 800, yoyo: true, repeat: -1 });
        break;
      }
      case 'index': {
        const card = this.add.rectangle(0, 0, s, s, COLORS.indexCard);
        card.setStrokeStyle(2, 0xfef3c7);
        this.demoContainer.add(card);
        this.tweens.add({ targets: card, scaleX: { from: 1, to: 1.1 }, scaleY: { from: 1, to: 1.1 }, duration: 600, yoyo: true, repeat: -1 });
        break;
      }
      case 'steps': {
        const counter = this.add.text(0, 0, '12/20', { fontSize: '24px', color: '#e6a817', fontFamily: 'sans-serif' }).setOrigin(0.5);
        this.demoContainer.add(counter);
        this.tweens.add({
          targets: counter,
          onUpdate: () => {
            const v = 12 + Math.floor((Date.now() / 500) % 9);
            counter.setText(`${v}/20`);
          },
          duration: 4500,
          repeat: -1,
        });
        break;
      }
    }
  }

  private prevStep(): void {
    if (!this.canInteract || this.currentStep <= 0) return;
    this.showStep(this.currentStep - 1);
  }

  private nextStep(): void {
    if (!this.canInteract || this.currentStep >= STEPS.length - 1) return;
    this.showStep(this.currentStep + 1);
  }

  private startTutorialLevel(): void {
    this.game.registry.set('currentLevelId', 'tutorial_01');
    this.scene.start('GameScene');
  }
}
