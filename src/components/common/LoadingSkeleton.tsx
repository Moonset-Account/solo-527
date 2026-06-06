export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-coffee-100 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-coffee-50 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="w-full h-full bg-coffee-50 rounded-lg flex items-end p-4 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-coffee-100 rounded-t"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  )
}
