import { BookOpen, Lightbulb, Menu } from 'lucide-react'
import useGameStore from '@/systems/GameStateManager'
import chapterManager from '@/systems/ChapterManager'

interface GameHUDProps {
  onNotebookClick: () => void
  onHintClick: () => void
  onMenuClick: () => void
}

export default function GameHUD({ onNotebookClick, onHintClick, onMenuClick }: GameHUDProps) {
  const currentChapter = useGameStore((s) => s.currentChapter)
  const currentRoom = useGameStore((s) => s.currentRoom)
  const hintPoints = useGameStore((s) => s.hintPoints)
  const notebook = useGameStore((s) => s.notebook)

  const chapterConfig = chapterManager.getChapter(currentChapter)
  const roomConfig = chapterManager.getRoom(currentChapter, currentRoom)

  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      <div className="absolute top-0 left-0 right-0 pointer-events-auto">
        <div className="flex items-center justify-between px-5 py-3 bg-black/50 border-b border-[#c8a86e]/15">
          <span className="font-serif text-sm text-amber-200/70 tracking-wide">
            {chapterConfig?.title || ''}
          </span>
          <span className="font-serif text-sm text-amber-200/70 tracking-wide">
            {roomConfig?.name || ''}
          </span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
        <div className="flex items-center justify-center gap-4 px-5 py-3 bg-black/50 border-t border-[#c8a86e]/15">
          <button
            onClick={onNotebookClick}
            className="relative flex items-center gap-2 px-4 py-2 rounded-md text-amber-200/70 hover:text-amber-200 hover:shadow-[0_0_12px_rgba(200,168,110,0.3)] transition-all duration-300"
          >
            <BookOpen size={18} />
            <span className="text-xs font-serif tracking-wide">笔记</span>
            {notebook.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-[10px] text-amber-100 flex items-center justify-center font-bold">
                {notebook.length}
              </span>
            )}
          </button>

          <button
            onClick={onHintClick}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-amber-200/70 hover:text-amber-200 hover:shadow-[0_0_12px_rgba(200,168,110,0.3)] transition-all duration-300"
          >
            <Lightbulb size={18} />
            <span className="text-xs font-serif tracking-wide">提示 ({hintPoints})</span>
          </button>

          <button
            onClick={onMenuClick}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-amber-200/70 hover:text-amber-200 hover:shadow-[0_0_12px_rgba(200,168,110,0.3)] transition-all duration-300"
          >
            <Menu size={18} />
            <span className="text-xs font-serif tracking-wide">菜单</span>
          </button>
        </div>
      </div>
    </div>
  )
}
