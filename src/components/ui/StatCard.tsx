import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number | { value: number; isUp: boolean };
  trendLabel?: string;
  color?: 'primary' | 'accent' | 'danger' | 'neutral' | 'blue';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'primary',
  className,
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    danger: 'bg-danger-50 text-danger-600',
    neutral: 'bg-neutral-100 text-neutral-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  const getTrendValue = () => {
    if (typeof trend === 'number') return trend;
    return trend?.value ?? 0;
  };

  const getTrendIsUp = () => {
    if (typeof trend === 'number') return trend >= 0;
    return trend?.isUp ?? true;
  };

  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-card p-6 transition-all duration-300 hover:shadow-card-hover',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            colorClasses[color]
          )}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg',
              getTrendIsUp() ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            )}
          >
            {getTrendIsUp() ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {Math.abs(getTrendValue())}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-neutral-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-neutral-800">{value}</p>
        {trendLabel && <p className="text-xs text-neutral-400 mt-1">{trendLabel}</p>}
      </div>
    </div>
  );
};
