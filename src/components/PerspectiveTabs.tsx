import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/store/useDashboardStore';
import type { ViewPerspective } from '../../shared/types';

const tabs: { label: string; value: ViewPerspective }[] = [
  { label: '项目视角', value: 'project' },
  { label: '顾问视角', value: 'consultant' },
  { label: '渠道视角', value: 'channel' },
  { label: '阶段视角', value: 'stage' },
  { label: '月份视角', value: 'month' },
];

export default function PerspectiveTabs() {
  const perspective = useDashboardStore((s) => s.perspective);
  const setPerspective = useDashboardStore((s) => s.setPerspective);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const measureIndicator = useCallback(() => {
    const idx = tabs.findIndex((t) => t.value === perspective);
    const el = tabRefs.current[idx];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [perspective]);

  useEffect(() => {
    measureIndicator();
    window.addEventListener('resize', measureIndicator);
    return () => window.removeEventListener('resize', measureIndicator);
  }, [measureIndicator]);

  return (
    <div className="relative inline-flex items-center gap-1 rounded-lg bg-slate-800/40 p-1">
      {tabs.map((tab, i) => (
        <button
          key={tab.value}
          ref={(el) => { tabRefs.current[i] = el; }}
          type="button"
          onClick={() => setPerspective(tab.value)}
          className={cn(
            'relative z-10 rounded-md px-4 py-2 font-sans text-sm font-medium transition-colors',
            perspective === tab.value
              ? 'text-emerald-500'
              : 'text-slate-400 hover:text-slate-200',
          )}
        >
          {tab.label}
        </button>
      ))}
      <span
        className="absolute bottom-1 h-[2px] rounded-full bg-emerald-500 transition-all duration-300 ease-out"
        style={{
          left: indicator.left,
          width: indicator.width,
        }}
      />
    </div>
  );
}
