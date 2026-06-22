import * as React from 'react';
import { cn } from '@/utils';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export const Table: React.FC<TableProps> = ({ className, ...props }) => (
  <div className="w-full overflow-auto">
    <table className={cn('w-full text-sm', className)} {...props} />
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <thead className={cn('bg-slate-50', className)} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => {
  return <tbody className={cn('divide-y divide-slate-200', className)} {...props} />;
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  ...props
}) => (
  <tr
    className={cn(
      'transition-colors hover:bg-slate-50',
      className
    )}
    {...props}
  />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <th
    className={cn(
      'text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3',
      className
    )}
    {...props}
  />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <td className={cn('px-4 py-3 text-slate-600 whitespace-nowrap', className)} {...props} />
);
