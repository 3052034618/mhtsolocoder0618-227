import React from 'react';
import { MapPin, Phone } from 'lucide-react';
import type { Cleaner } from '../../types';
import { StatusBadge, RatingBadge, SkillBadge } from './StatusBadge';
import { formatRelativeTime, cn } from '../../utils';

interface CleanerCardProps {
  cleaner: Cleaner;
  distance?: number;
  matchScore?: number;
  selected?: boolean;
  onClick?: () => void;
  showActions?: boolean;
  className?: string;
}

export const CleanerCard: React.FC<CleanerCardProps> = ({
  cleaner,
  distance,
  matchScore,
  selected = false,
  onClick,
  showActions = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-card p-5 transition-all duration-300',
        onClick && 'cursor-pointer hover:shadow-card-hover',
        selected && 'ring-2 ring-primary-500',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <img
          src={cleaner.avatar}
          alt={cleaner.name}
          className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-neutral-800 truncate">{cleaner.name}</h3>
            <StatusBadge status={cleaner.status} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <RatingBadge rating={cleaner.rating} />
            <span className="text-sm text-neutral-500">累计{cleaner.totalOrders}单</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {cleaner.skills.map((skill) => (
              <SkillBadge key={skill} skill={skill} />
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            {distance !== undefined && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{distance}km</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <span>{cleaner.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {matchScore !== undefined && (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">匹配度</span>
            <span className="text-sm font-semibold text-primary-600">{matchScore}%</span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>
      )}

      {showActions && (
        <div className="mt-4 pt-4 border-t border-neutral-100 flex gap-3">
          <button className="flex-1 py-2 rounded-xl bg-primary-50 text-primary-600 font-medium hover:bg-primary-100 transition-colors">
            查看详情
          </button>
          <button className="flex-1 py-2 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors">
            派单
          </button>
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-400">
        加入时间：{formatRelativeTime(cleaner.createdAt)}
      </p>
    </div>
  );
};
