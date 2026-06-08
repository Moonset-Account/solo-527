import { LevelData } from '../models/types';
import { SaveManager } from './SaveManager';

export enum HintTier {
  NONE = 0,
  TIER1_VAGUE = 1,
  TIER2_SPECIFIC = 2,
  TIER3_HIGHLIGHT = 3,
}

export class HintManager {
  private saveManager: SaveManager;
  private levelData: LevelData | null = null;
  private currentTier: HintTier = HintTier.NONE;
  private highlightActive: boolean = false;

  constructor() {
    this.saveManager = SaveManager.getInstance();
  }

  setLevelData(data: LevelData): void {
    this.levelData = data;
    this.currentTier = HintTier.NONE;
    this.highlightActive = false;
  }

  getHintTier(): HintTier {
    return this.currentTier;
  }

  requestHint(): { tier: HintTier; text: string; highlightArea?: { shelfId: string; bookId: string } } {
    if (!this.levelData) {
      return { tier: HintTier.NONE, text: '' };
    }

    const wrongAttempts = this.saveManager.getWrongAttempts();

    if (wrongAttempts < 1 && this.currentTier === HintTier.NONE) {
      this.currentTier = HintTier.TIER1_VAGUE;
      return {
        tier: HintTier.TIER1_VAGUE,
        text: this.levelData.hintTier1,
      };
    }

    if (wrongAttempts >= 1 && this.currentTier <= HintTier.TIER1_VAGUE) {
      this.currentTier = HintTier.TIER2_SPECIFIC;
      return {
        tier: HintTier.TIER2_SPECIFIC,
        text: this.levelData.hintTier2,
      };
    }

    if (wrongAttempts >= 3 && this.currentTier <= HintTier.TIER2_SPECIFIC) {
      this.currentTier = HintTier.TIER3_HIGHLIGHT;
      this.highlightActive = true;
      return {
        tier: HintTier.TIER3_HIGHLIGHT,
        text: '线索似乎集中在某个区域……仔细看看高亮的地方',
        highlightArea: this.levelData.hintHighlightArea,
      };
    }

    return {
      tier: this.currentTier,
      text: '继续观察你已经发现的线索，注意其中的矛盾之处',
    };
  }

  isHighlightActive(): boolean {
    return this.highlightActive;
  }

  shouldShowHintAfterWrong(): boolean {
    return this.saveManager.getWrongAttempts() >= 1;
  }

  getContradictionHint(bookId: string): string | null {
    if (!this.levelData) return null;

    const relatedClues = this.levelData.clues.filter(
      (c) => c.relatedBookIds.includes(bookId) && !c.isMisleading
    );

    if (relatedClues.length === 0) return null;

    const book = this.levelData.books.find((b) => b.id === bookId);
    if (!book) return null;

    const currentShelf = this.levelData.shelves.find((s) => s.id === book.currentShelfId);

    if (!book.isMisplaced) {
      return `《${book.title}》的分类标记「${book.category}」与${currentShelf?.label ?? '当前书架'}的标签一致——也许它并不是错位的？`;
    }

    return `《${book.title}》的借阅卡归属区域与它当前所在的书架标签存在矛盾——这就是你判断的依据`;
  }

  resetForNewLevel(): void {
    this.currentTier = HintTier.NONE;
    this.highlightActive = false;
    this.levelData = null;
  }
}
