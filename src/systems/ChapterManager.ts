import type { ChapterConfig, PuzzleConfig, Item } from '@/types'
import chapter1Config from '@/config/chapters/chapter1.json'
import chapter2Config from '@/config/chapters/chapter2.json'
import chapter3Config from '@/config/chapters/chapter3.json'
import itemsData from '@/config/items.json'
import puzzlesData from '@/config/puzzles.json'

const chapters: Record<string, ChapterConfig> = {
  chapter1: chapter1Config as ChapterConfig,
  chapter2: chapter2Config as ChapterConfig,
  chapter3: chapter3Config as ChapterConfig,
}

const items: Record<string, Item> = itemsData as Record<string, Item>

const puzzles: PuzzleConfig[] = puzzlesData as PuzzleConfig[]

class ChapterManager {
  getChapter(chapterId: string): ChapterConfig | null {
    return chapters[chapterId] || null
  }

  getRoom(chapterId: string, roomId: string) {
    const chapter = this.getChapter(chapterId)
    if (!chapter) return null
    return chapter.rooms.find(r => r.id === roomId) || null
  }

  getItem(itemId: string): Item | null {
    return items[itemId] || null
  }

  getPuzzle(puzzleId: string): PuzzleConfig | null {
    return puzzles.find(p => p.id === puzzleId) || null
  }

  getPuzzlesForRoom(chapterId: string, roomId: string): PuzzleConfig[] {
    return puzzles.filter(p => p.chapter === chapterId && p.room === roomId)
  }

  getAllChapters(): Record<string, ChapterConfig> {
    return chapters
  }

  getChapterList(): ChapterConfig[] {
    return Object.values(chapters)
  }

  getStartRoom(chapterId: string): string | null {
    const chapter = this.getChapter(chapterId)
    return chapter?.startRoom || null
  }

  getDoorByHotspot(chapterId: string, roomId: string, hotspotId: string) {
    const room = this.getRoom(chapterId, roomId)
    if (!room) return null
    return room.doors.find(d => d.hotspotId === hotspotId) || null
  }

  isDoorLocked(chapterId: string, roomId: string, hotspotId: string): boolean {
    const door = this.getDoorByHotspot(chapterId, roomId, hotspotId)
    return door?.locked || false
  }

  calculateSettlement(chapterId: string, completionTime: number, retryCount: number, hintsUsed: number, cluesFound: number, totalClues: number) {
    const clueRate = totalClues > 0 ? cluesFound / totalClues : 0
    let score = 100
    score -= Math.min(retryCount * 5, 30)
    score -= Math.min(hintsUsed * 8, 40)
    score *= clueRate
    score -= Math.min(completionTime / 60000, 20)

    let rating: 'S' | 'A' | 'B' | 'C'
    if (score >= 90) rating = 'S'
    else if (score >= 70) rating = 'A'
    else if (score >= 50) rating = 'B'
    else rating = 'C'

    return {
      chapterId,
      completionTime,
      retryCount,
      hintsUsed,
      cluesFound,
      totalClues,
      rating,
    }
  }
}

const chapterManager = new ChapterManager()
export default chapterManager
