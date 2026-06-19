'use client';

import type { ReactNode } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  addHref?: string;
  addLabel?: string;
  backHref?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  addHref,
  addLabel = '新增',
  backHref,
}: PageHeaderProps) {
  return (
    <div className="mb-6 animate-fade-in-up">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 mb-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {addHref && (
            <Link href={addHref} className="btn-primary">
              <Plus className="w-4 h-4" />
              {addLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
