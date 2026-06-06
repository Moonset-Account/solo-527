import { AlertTriangle, TrendingDown, Droplets, Users, ShoppingBag } from 'lucide-react';
import type { Anomaly } from '@shared/types';
import { getSeverityColor, getSeverityTextColor, formatNumber } from '~/utils/format';
import { useFilters } from '~/contexts/FilterContext';

const anomalyIcons: Record<string, any> = {
  high_loss: TrendingDown,
  near_expiry: AlertTriangle,
  poor_promotion: ShoppingBag,
  weather_impact: Droplets,
  low_traffic: Users,
};

export default function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const { applyAnomalyFilters } = useFilters();
  const Icon = anomalyIcons[anomaly.type] || AlertTriangle;

  const handleClick = () => {
    if (anomaly.filterContext) {
      applyAnomalyFilters(anomaly.filterContext);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-5 rounded-2xl border-l-4 ${getSeverityColor(anomaly.severity)} 
        cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl 
        hover:shadow-black/20 bg-slate-800/50 backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${getSeverityTextColor(anomaly.severity)} bg-current/10`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{anomaly.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{anomaly.description}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className={`text-2xl font-display font-bold ${getSeverityTextColor(anomaly.severity)}`}>
            {typeof anomaly.metric.value === 'number' && anomaly.metric.value < 0 
              ? '' 
              : ''}{formatNumber(anomaly.metric.value, 1)}{anomaly.metric.unit}
          </p>
        </div>
        <div className={`text-xs font-medium px-2 py-1 rounded-lg ${
          anomaly.metric.change > 0 
            ? 'bg-loss-red/20 text-loss-red' 
            : 'bg-fresh-green/20 text-fresh-green'
        }`}>
          {anomaly.metric.change > 0 ? '+' : ''}{anomaly.metric.change.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
