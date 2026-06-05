import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  description?: string;
}

export default function EmptyState({ icon, message, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {icon || <Inbox size={28} className="text-slate-400" />}
      </div>
      <p className="text-slate-600 font-medium mb-1">{message}</p>
      {description && <p className="text-sm text-slate-400">{description}</p>}
    </div>
  );
}
