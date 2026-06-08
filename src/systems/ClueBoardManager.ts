import { ClueData } from '../models/types';
import { SaveManager } from './SaveManager';

export class ClueBoardManager {
  private saveManager: SaveManager;
  private allClues: Map<string, ClueData> = new Map();

  constructor() {
    this.saveManager = SaveManager.getInstance();
  }

  loadClues(clues: ClueData[]): void {
    this.allClues.clear();
    clues.forEach((c) => this.allClues.set(c.id, c));
  }

  discoverClue(clueId: string): boolean {
    const clue = this.allClues.get(clueId);
    if (!clue) return false;
    this.saveManager.discoverClue(clueId);
    return true;
  }

  getDiscoveredClues(): ClueData[] {
    const ids = this.saveManager.getDiscoveredClues();
    return ids.map((id) => this.allClues.get(id)).filter((c): c is ClueData => !!c);
  }

  getAllClues(): ClueData[] {
    return Array.from(this.allClues.values());
  }

  markSuspect(bookId: string): void {
    this.saveManager.markSuspect(bookId);
  }

  unmarkSuspect(bookId: string): void {
    this.saveManager.unmarkSuspect(bookId);
  }

  toggleSuspect(bookId: string): void {
    this.saveManager.toggleSuspect(bookId);
  }

  getMarkedSuspects(): string[] {
    return this.saveManager.getMarkedSuspects();
  }

  isMarked(bookId: string): boolean {
    return this.saveManager.getMarkedSuspects().includes(bookId);
  }

  findContradictions(): { clue1: ClueData; clue2: ClueData }[] {
    const discovered = this.getDiscoveredClues();
    const contradictions: { clue1: ClueData; clue2: ClueData }[] = [];

    for (const clue of discovered) {
      if (clue.isMisleading && clue.contradictionWith) {
        const other = this.allClues.get(clue.contradictionWith);
        if (other && discovered.includes(other)) {
          contradictions.push({ clue1: clue, clue2: other });
        }
      }
    }

    return contradictions;
  }
}
