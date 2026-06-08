import { cn } from '@/lib/utils'

interface EmptyStateProps {
  type?: 'empty' | 'loading' | 'error'
  message?: string
  onRetry?: () => void
}

export default function EmptyState({ type = 'empty', message, onRetry }: EmptyStateProps) {
  if (type === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <div className="flex gap-1 mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-[#6C5CE7] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-sm">数据加载中...</p>
      </div>
    )
  }

  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-[#FF6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-sm mb-2">{message || '数据加载失败'}</p>
        {onRetry && (
          <button onClick={onRetry} className="text-xs text-[#6C5CE7] hover:underline">
            点击重试
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm">{message || '暂无数据'}</p>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="h-3 bg-slate-200 rounded w-20 mb-3" />
      <div className="h-8 bg-slate-200 rounded w-28 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-16" />
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className={cn("animate-pulse rounded-xl bg-white p-5 shadow-sm border border-slate-100")}>
      <div className="h-4 bg-slate-200 rounded w-32 mb-4" />
      <div className="flex items-end gap-2 h-40">
        {[40, 65, 50, 80, 55, 70, 45, 60, 75, 50, 65, 55].map((h, i) => (
          <div key={i} className="flex-1 bg-slate-100 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}
