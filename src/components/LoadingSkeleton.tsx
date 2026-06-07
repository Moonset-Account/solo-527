interface LoadingSkeletonProps {
  type: 'card' | 'chart' | 'table' | 'map'
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-[#22252d] p-4 space-y-3">
      <div className="h-4 w-1/3 rounded bg-[#2a2d35]" />
      <div className="h-8 w-2/3 rounded bg-[#2a2d35]" />
      <div className="h-3 w-1/2 rounded bg-[#2a2d35]" />
      <div className="h-3 w-1/4 rounded bg-[#2a2d35]" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-[#22252d] p-4">
      <div className="h-4 w-1/4 rounded bg-[#2a2d35] mb-4" />
      <div className="relative h-48 w-full overflow-hidden rounded bg-[#2a2d35]">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 192"
          preserveAspectRatio="none"
        >
          <path
            d="M0,160 C40,120 80,140 120,100 C160,60 200,80 240,50 C280,20 320,60 360,30 L400,10 L400,192 L0,192 Z"
            fill="rgba(42,45,53,0.6)"
          />
        </svg>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-[#22252d] p-4 space-y-3">
      <div className="h-4 w-1/4 rounded bg-[#2a2d35] mb-2" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-4 flex-1 rounded bg-[#2a2d35]" />
          <div className="h-4 w-16 rounded bg-[#2a2d35]" />
        </div>
      ))}
    </div>
  )
}

function MapSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-[#22252d] p-4">
      <div className="h-4 w-1/4 rounded bg-[#2a2d35] mb-3" />
      <div className="relative h-64 w-full rounded bg-[#2a2d35] overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 256"
          preserveAspectRatio="none"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={32 * (i + 1)}
              x2="400"
              y2={32 * (i + 1)}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={40 * (i + 1)}
              y1="0"
              x2={40 * (i + 1)}
              y2="256"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

export default function LoadingSkeleton({ type }: LoadingSkeletonProps) {
  switch (type) {
    case 'card':
      return <CardSkeleton />
    case 'chart':
      return <ChartSkeleton />
    case 'table':
      return <TableSkeleton />
    case 'map':
      return <MapSkeleton />
  }
}
