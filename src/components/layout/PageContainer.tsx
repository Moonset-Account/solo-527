import { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function PageContainer({ title, subtitle, children, actions }: PageContainerProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
