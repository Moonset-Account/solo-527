import { motion } from 'framer-motion'

interface HintDisplayProps {
  hintText: string
  level: 1 | 2 | 3
}

const levelLabels: Record<number, string> = {
  1: 'L1',
  2: 'L2',
  3: 'L3',
}

export default function HintDisplay({ hintText, level }: HintDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-4 px-4 py-3 rounded border border-amber-900/40 bg-amber-950/20"
    >
      <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-amber-800/40 text-amber-400 mr-2">
        {levelLabels[level]}
      </span>
      <span className="italic text-amber-300/80 text-sm">{hintText}</span>
    </motion.div>
  )
}
