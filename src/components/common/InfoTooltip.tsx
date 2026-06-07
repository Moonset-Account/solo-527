import { Info, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface InfoTooltipProps {
  content: string;
  title?: string;
  type?: 'info' | 'help';
  size?: 'sm' | 'md';
}

export function InfoTooltip({ content, title, type = 'info', size = 'sm' }: InfoTooltipProps) {
  const [show, setShow] = useState(false);

  const Icon = type === 'info' ? Info : HelpCircle;
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="relative inline-block">
      <button
        className="text-slate-400 hover:text-slate-600 transition-colors cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        <Icon className={sizeClasses} />
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg">
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className="text-slate-300 leading-relaxed">{content}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}
