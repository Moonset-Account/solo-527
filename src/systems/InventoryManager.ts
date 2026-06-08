import { InventoryItem } from '../models/types';
import { SaveManager } from './SaveManager';

export class InventoryManager {
  private saveManager: SaveManager;

  constructor() {
    this.saveManager = SaveManager.getInstance();
  }

  addItem(item: InventoryItem): void {
    this.saveManager.addInventoryItem(item);
  }

  removeItem(id: string): void {
    this.saveManager.removeInventoryItem(id);
  }

  getItems(): InventoryItem[] {
    return this.saveManager.getInventory();
  }

  hasItem(id: string): boolean {
    return this.saveManager.getInventory().some((i) => i.id === id);
  }

  getItemByType(type: InventoryItem['type']): InventoryItem | undefined {
    return this.saveManager.getInventory().find((i) => i.type === type);
  }

  reset(): void {
    this.saveManager.resetForNewLevel();
  }
}
