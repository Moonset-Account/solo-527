import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  suffix?: string;
  color?: 'primary' | 'secondary' | 'accent';
}

export function StatsCard({ icon: Icon, label, value, suffix, color = 'primary' }: StatsCardProps) {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    accent: 'from-amber-500 to-orange-600',
  };

  return (
    <div className="relative group">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${colorClasses[color]} rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500`} />
      <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-2">{label}</p>
            <p className="text-3xl font-bold text-gray-900 font-serif animate-number-scroll">
              {value}
              {suffix && <span className="text-lg font-normal text-gray-500 ml-1">{suffix}</span>}
            </p>
          </div>
          <div className={`p-3 bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
