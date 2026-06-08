import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, Music, Volume1, Lightbulb } from 'lucide-react'
import soundManager from '@/systems/SoundManager'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [masterVolume, setMasterVolume] = useState(1.0)
  const [musicVolume, setMusicVolume] = useState(0.3)
  const [sfxVolume, setSfxVolume] = useState(0.5)
  const [hintEnabled, setHintEnabled] = useState(true)

  const handleMasterVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setMasterVolume(v)
    soundManager.setMasterVolume(v)
  }, [])

  const handleMusicVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setMusicVolume(v)
  }, [])

  const handleSfxVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setSfxVolume(v)
  }, [])

  const handleHintToggle = useCallback(() => {
    setHintEnabled((prev) => !prev)
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/85" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-sm mx-4 rounded-lg border border-[#5a5040]/50 overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #2a2520 0%, #1a1612 40%, #252018 100%)',
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-amber-200/40 hover:text-amber-200 transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="px-6 pt-6 pb-4 border-b border-[#5a5040]/20">
              <h2 className="font-serif text-lg text-amber-200/90 tracking-wider text-center">设置</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 size={16} className="text-amber-400/60" />
                  <label className="font-serif text-sm text-amber-200/70 tracking-wide">主音量</label>
                  <span className="ml-auto text-xs text-amber-200/40">{Math.round(masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={masterVolume}
                  onChange={handleMasterVolume}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #c8a86e ${masterVolume * 100}%, #3a3530 ${masterVolume * 100}%)`,
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Music size={16} className="text-amber-400/60" />
                  <label className="font-serif text-sm text-amber-200/70 tracking-wide">音乐音量</label>
                  <span className="ml-auto text-xs text-amber-200/40">{Math.round(musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={musicVolume}
                  onChange={handleMusicVolume}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #c8a86e ${musicVolume * 100}%, #3a3530 ${musicVolume * 100}%)`,
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Volume1 size={16} className="text-amber-400/60" />
                  <label className="font-serif text-sm text-amber-200/70 tracking-wide">音效音量</label>
                  <span className="ml-auto text-xs text-amber-200/40">{Math.round(sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={sfxVolume}
                  onChange={handleSfxVolume}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #c8a86e ${sfxVolume * 100}%, #3a3530 ${sfxVolume * 100}%)`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-400/60" />
                  <label className="font-serif text-sm text-amber-200/70 tracking-wide">提示系统</label>
                </div>
                <button
                  onClick={handleHintToggle}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                    hintEnabled ? 'bg-amber-700/60' : 'bg-[#3a3530]/60'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-amber-200/80"
                    animate={{ left: hintEnabled ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
