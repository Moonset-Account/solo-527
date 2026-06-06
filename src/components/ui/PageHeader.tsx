'use client';

import { Button } from './Button';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  backHref?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, action, backHref, children }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="mt-1 text-gray-500">{description}</p>}
        </div>
        {action && (
          <div className="flex items-center gap-3">
            {children}
            {action.href ? (
              <Link href={action.href}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button onClick={action.onClick}>
                <Plus className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
