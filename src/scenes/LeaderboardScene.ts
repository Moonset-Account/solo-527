import Phaser from 'phaser';
import { GameConfig } from '@/config/GameConfig';
import { AudioSystem } from '@/systems/AudioSystem';
import { DailySystem, LeaderboardEntry } from '@/systems/DailySystem';
import { LEVELS } from '@/config/levels';

export class LeaderboardScene extends Phaser.Scene {
  private audioSys!: AudioSystem;
  private currentLevelId: number = 1;
  private isDaily: boolean = false;
  private listContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'leaderboard' });
  }

  create(): void {
    this.audioSys = new AudioSystem(this);
    this.cameras.main.setBackgroundColor(`#${GameConfig.Colors.BG_NIGHT.toString(16).padStart(6, '0')}`);

    const cx = GameConfig.CANVAS_WIDTH / 2;

    this.add.text(cx, 36, '排行榜', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const tabY = 84;
    const tabW = 220;
    const tabH = 36;
    const tabNormalBg = this.add.graphics();
    const tabDailyBg = this.add.graphics();
    this.drawTab(cx - tabW / 2 - 6, tabY, tabW, tabH, !this.isDaily, tabNormalBg);
    this.drawTab(cx + tabW / 2 + 6, tabY, tabW, tabH, this.isDaily, tabDailyBg);

    this.add.text(cx - tabW / 2 - 6 + tabW / 2, tabY, '普通模式', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx + tabW / 2 + 6 + tabW / 2, tabY, '每日挑战', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const tabNormalHit = this.add.rectangle(cx - tabW / 2 - 6, tabY, tabW, tabH, 0, 0).setInteractive({ useHandCursor: true });
    tabNormalHit.on('pointerdown', () => {
      if (!this.isDaily) return;
      this.isDaily = false;
      this.audioSys.playSfx('click');
      this.drawTab(cx - tabW / 2 - 6, tabY, tabW, tabH, true, tabNormalBg);
      this.drawTab(cx + tabW / 2 + 6, tabY, tabW, tabH, false, tabDailyBg);
      this.refreshList();
    });
    const tabDailyHit = this.add.rectangle(cx + tabW / 2 + 6, tabY, tabW, tabH, 0, 0).setInteractive({ useHandCursor: true });
    tabDailyHit.on('pointerdown', () => {
      if (this.isDaily) return;
      this.isDaily = true;
      this.audioSys.playSfx('click');
      this.drawTab(cx - tabW / 2 - 6, tabY, tabW, tabH, false, tabNormalBg);
      this.drawTab(cx + tabW / 2 + 6, tabY, tabW, tabH, true, tabDailyBg);
      this.refreshList();
    });

    const levelSelY = 140;
    this.add.text(cx - 250, levelSelY, '关卡：', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    const levelBtns: Phaser.GameObjects.Container[] = [];
    const btnW = 44;
    const btnH = 30;
    for (let i = 0; i < GameConfig.TOTAL_LEVELS; i++) {
      const id = i + 1;
      const bx = cx - 200 + i * (btnW + 8);
      const cont = this.add.container(bx, levelSelY);
      const g = this.add.graphics();
      const active = id === this.currentLevelId;
      g.fillStyle(active ? GameConfig.Colors.ACCENT : GameConfig.Colors.BG_FLOOR_ALT, 1);
      g.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
      g.lineStyle(2, GameConfig.Colors.SHADOW, 0.3);
      g.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
      const label = this.add.text(0, 0, String(id), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      cont.add([g, label]);
      cont.setSize(btnW, btnH);
      cont.setInteractive({ useHandCursor: true });
      cont.on('pointerover', () => {
        g.clear();
        g.fillStyle(GameConfig.Colors.PLAYER, 1);
        g.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        g.lineStyle(2, GameConfig.Colors.SHADOW, 0.5);
        g.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        cont.setScale(1.05);
      });
      cont.on('pointerout', () => {
        const a = id === this.currentLevelId;
        g.clear();
        g.fillStyle(a ? GameConfig.Colors.ACCENT : GameConfig.Colors.BG_FLOOR_ALT, 1);
        g.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        g.lineStyle(2, GameConfig.Colors.SHADOW, 0.3);
        g.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        cont.setScale(1);
      });
      cont.on('pointerdown', () => {
        if (this.currentLevelId === id) return;
        this.audioSys.playSfx('click');
        this.currentLevelId = id;
        levelBtns.forEach((c, j) => {
          const gid = j + 1;
          const gg = (c.list[0] as Phaser.GameObjects.Graphics);
          const ac = gid === this.currentLevelId;
          gg.clear();
          gg.fillStyle(ac ? GameConfig.Colors.ACCENT : GameConfig.Colors.BG_FLOOR_ALT, 1);
          gg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
          gg.lineStyle(2, GameConfig.Colors.SHADOW, 0.3);
          gg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        });
        this.refreshList();
      });
      levelBtns.push(cont);
    }

    const levelInfo = this.add.text(cx + 60, levelSelY, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);
    const updateInfo = () => {
      const lv = LEVELS.find((l) => l.id === this.currentLevelId);
      levelInfo.setText(lv ? lv.name : '');
    };
    updateInfo();

    this.listContainer = this.add.container(cx, 0);
    this.refreshList();

    this.makeButton(cx, GameConfig.CANVAS_HEIGHT - 40, 160, 44, '返回', () => {
      this.audioSys.destroy();
      this.scene.start('level_select');
    });
  }

  private drawTab(x: number, y: number, w: number, h: number, active: boolean, g: Phaser.GameObjects.Graphics): void {
    g.clear();
    if (active) {
      g.fillStyle(GameConfig.Colors.ACCENT, 1);
    } else {
      g.fillStyle(GameConfig.Colors.BG_FLOOR_ALT, 0.7);
    }
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    g.lineStyle(2, GameConfig.Colors.SHADOW, active ? 0.5 : 0.25);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
  }

  private refreshList(): void {
    this.listContainer.removeAll(true);

    const entries = DailySystem.getLeaderboard(this.currentLevelId, this.isDaily);
    const listY = 190;
    const itemW = 520;
    const itemH = 44;

    const headerBg = this.add.graphics();
    headerBg.fillStyle(GameConfig.Colors.ACCENT, 0.5);
    headerBg.fillRoundedRect(-itemW / 2, listY - itemH / 2, itemW, itemH, 8);
    const headerRank = this.add.text(-itemW / 2 + 28, listY, '#', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const headerName = this.add.text(-itemW / 2 + 80, listY, '玩家', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const headerStars = this.add.text(itemW / 2 - 140, listY, '星级', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const headerSteps = this.add.text(itemW / 2 - 40, listY, '步数', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.listContainer.add([headerBg, headerRank, headerName, headerStars, headerSteps]);

    if (entries.length === 0) {
      const empty = this.add.text(0, listY + itemH + 40, '暂无记录，快来挑战吧！', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: `#${GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5);
      this.listContainer.add(empty);
      return;
    }

    entries.forEach((e, i) => {
      const y = listY + (i + 1) * (itemH + 4);
      this.makeEntry(y, itemW, itemH, i + 1, e);
    });
  }

  private makeEntry(y: number, w: number, h: number, rank: number, entry: LeaderboardEntry): void {
    const bg = this.add.graphics();
    let color = GameConfig.Colors.BG_FLOOR_ALT;
    if (rank === 1) color = 0xffd700;
    else if (rank === 2) color = 0xc0c0c0;
    else if (rank === 3) color = 0xcd7f32;
    const alpha = rank <= 3 ? 0.25 : 1;
    bg.fillStyle(color, alpha);
    bg.fillRoundedRect(-w / 2, y - h / 2, w, h, 8);
    bg.lineStyle(1, GameConfig.Colors.TEXT_DIM, 0.2);
    bg.strokeRoundedRect(-w / 2, y - h / 2, w, h, 8);

    let rankStr = String(rank);
    if (rank === 1) rankStr = '🥇';
    else if (rank === 2) rankStr = '🥈';
    else if (rank === 3) rankStr = '🥉';
    const rankColor = rank <= 3 ? GameConfig.Colors.TARGET : GameConfig.Colors.TEXT;
    const rankText = this.add.text(-w / 2 + 28, y, rankStr, {
      fontFamily: 'monospace',
      fontSize: rank <= 3 ? '18px' : '14px',
      color: `#${rankColor.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const nameText = this.add.text(-w / 2 + 80, y, entry.name, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    const starsStr = '★'.repeat(entry.stars) + '☆'.repeat(3 - entry.stars);
    const starsText = this.add.text(w / 2 - 140, y, starsStr, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${entry.stars > 0 ? GameConfig.Colors.TARGET.toString(16).padStart(6, '0') : GameConfig.Colors.TEXT_DIM.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const stepsText = this.add.text(w / 2 - 40, y, String(entry.steps), {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.listContainer.add([bg, rankText, nameText, starsText, stepsText]);
  }

  private makeButton(x: number, y: number, w: number, h: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const cont = this.add.container(x, y);
    const normalColor = GameConfig.Colors.ACCENT;
    const hoverColor = GameConfig.Colors.PLAYER;
    const g = this.add.graphics();
    g.fillStyle(normalColor, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    g.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: `#${GameConfig.Colors.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    cont.add([g, text]);
    cont.setSize(w, h);
    cont.setInteractive({ useHandCursor: true });
    cont.on('pointerover', () => {
      g.clear();
      g.fillStyle(hoverColor, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.lineStyle(2, GameConfig.Colors.SHADOW, 0.6);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      cont.setScale(1.05);
    });
    cont.on('pointerout', () => {
      g.clear();
      g.fillStyle(normalColor, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.lineStyle(2, GameConfig.Colors.SHADOW, 0.4);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      cont.setScale(1);
    });
    cont.on('pointerdown', () => {
      this.audioSys.playSfx('click');
      onClick();
    });
    return cont;
  }

  shutdown(): void {
    this.audioSys?.destroy();
  }
}
