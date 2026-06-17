import React from 'react';
import { ORDER_STATUS_CONFIG } from '../../types';
import type { OrderStatus, CleanerStatus } from '../../types';
import { cn } from '../../utils';

interface StatusBadgeProps {
  status: OrderStatus | CleanerStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const CLEANER_STATUS_CONFIG: Record<CleanerStatus, { label: string; color: string; bgColor: string }> = {
  available: { label: '空闲', color: 'text-green-600', bgColor: 'bg-green-50' },
  busy: { label: '忙碌', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  offline: { label: '离线', color: 'text-gray-600', bgColor: 'bg-gray-50' },
  on_leave: { label: '休假', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  rest: { label: '休息', color: 'text-blue-600', bgColor: 'bg-blue-50' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className }) => {
  const config =
    ORDER_STATUS_CONFIG[status as OrderStatus] ||
    CLEANER_STATUS_CONFIG[status as CleanerStatus];

  if (!config) return null;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5 mr-1',
    md: 'w-2 h-2 mr-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        config.bgColor,
        config.color,
        className
      )}
    >
      <span
        className={cn(
          'rounded-full',
          dotSizeClasses[size],
          config.color.replace('text-', 'bg-')
        )}
      ></span>
      {config.label}
    </span>
  );
};

interface RatingBadgeProps {
  rating: number;
  className?: string;
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({ rating, className }) => {
  const getColor = () => {
    if (rating >= 4.8) return 'bg-green-50 text-green-600';
    if (rating >= 4.5) return 'bg-blue-50 text-blue-600';
    if (rating >= 4.0) return 'bg-amber-50 text-amber-600';
    return 'bg-red-50 text-red-600';
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold',
        getColor(),
        className
      )}
    >
      <svg
        className="w-4 h-4 mr-1 text-amber-400 fill-current"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {rating.toFixed(1)}
    </span>
  );
};

interface SkillBadgeProps {
  skill: string;
  className?: string;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({ skill, className }) => {
  const labelMap: Record<string, string> = {
    daily: '日常保洁',
    deep: '深度清洁',
    moving: '搬家打扫',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100',
        className
      )}
    >
      {labelMap[skill] || skill}
    </span>
  );
};
