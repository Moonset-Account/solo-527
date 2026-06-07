import React from 'react';
import { HazardStatus, HazardLevel, FineStatus, AppealStatus } from '@/types';
import { statusConfig, levelConfig, fineStatusConfig, appealStatusConfig, cn } from '@/utils';

interface StatusBadgeProps {
  status: HazardStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
};

interface LevelBadgeProps {
  level: HazardLevel;
  className?: string;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, className }) => {
  const config = levelConfig[level];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
};

interface FineStatusBadgeProps {
  status: FineStatus;
  className?: string;
}

export const FineStatusBadge: React.FC<FineStatusBadgeProps> = ({ status, className }) => {
  const config = fineStatusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
};

interface AppealStatusBadgeProps {
  status: AppealStatus;
  className?: string;
}

export const AppealStatusBadge: React.FC<AppealStatusBadgeProps> = ({ status, className }) => {
  const config = appealStatusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
};
