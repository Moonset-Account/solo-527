import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface NarrativeOverlayProps {
  text: string
  onComplete: () => void
}

export default function NarrativeOverlay({ text, onComplete }: NarrativeOverlayProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setDisplayedText('')
    setIsComplete(false)
    let index = 0
    const interval = setInterval(() => {
      index++
      setDisplayedText(text.slice(0, index))
      if (index >= text.length) {
        clearInterval(interval)
        setIsComplete(true)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [text])

  useEffect(() => {
    if (!isComplete) return
    const timeout = setTimeout(onComplete, 3000)
    return () => clearTimeout(timeout)
  }, [isComplete, onComplete])

  const handleClick = useCallback(() => {
    if (!isComplete) {
      setDisplayedText(text)
      setIsComplete(true)
    } else {
      onComplete()
    }
  }, [isComplete, text, onComplete])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-x-0 bottom-0 z-40 cursor-pointer"
        onClick={handleClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-black/60 backdrop-blur-sm px-8 py-6">
          <p className="font-serif text-lg leading-relaxed text-[#c8a86e] max-w-3xl mx-auto">
            {displayedText}
            {!isComplete && (
              <span className="inline-block w-0.5 h-5 bg-[#c8a86e] ml-0.5 align-middle animate-pulse" />
            )}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
