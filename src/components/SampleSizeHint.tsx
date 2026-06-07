interface SampleSizeHintProps {
  sampleSize: number
}

export default function SampleSizeHint({ sampleSize }: SampleSizeHintProps) {
  if (sampleSize >= 30) {
    return null
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-3 py-2 rounded">
      当前筛选条件下样本量仅 {sampleSize} 条，结果可能不具统计意义
    </div>
  )
}
