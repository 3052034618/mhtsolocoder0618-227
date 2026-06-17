import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, User, ChevronRight } from 'lucide-react';
import type { Order } from '../../types';
import { SERVICE_CONFIG, ORDER_STATUS_CONFIG } from '../../types';
import { StatusBadge, RatingBadge } from './StatusBadge';
import { formatDate, getFullAddress, cn } from '../../utils';

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
  onAction?: (order: Order) => void;
  actionLabel?: string;
  compact?: boolean;
  className?: string;
  role?: 'customer' | 'cleaner' | 'dispatcher' | 'admin';
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  showActions = true,
  onAction,
  actionLabel = '查看详情',
  compact = false,
  className,
  role,
}) => {
  const navigate = useNavigate();
  const serviceConfig = SERVICE_CONFIG[order.serviceType];
  const statusConfig = ORDER_STATUS_CONFIG[order.status];

  const handleClick = () => {
    if (onAction) {
      onAction(order);
      return;
    }
    if (role === 'customer') {
      navigate(`/customer/orders/${order.id}`);
    } else if (role === 'cleaner') {
      navigate(`/cleaner/orders/${order.id}`);
    } else if (role === 'dispatcher' || role === 'admin') {
      navigate(`/dispatcher/orders/${order.id}`);
    } else {
      const basePath = order.cleanerId ? '/cleaner/orders' : '/customer/orders';
      navigate(`${basePath}/${order.id}`);
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-card transition-all duration-300 hover:shadow-card-hover cursor-pointer',
        compact ? 'p-4' : 'p-6',
        order.review?.isBadReview && !order.review.handled && 'ring-2 ring-danger-200',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-xl bg-primary-50 flex items-center justify-center", compact ? "w-10 h-10" : "w-12 h-12")}>
            <span className={compact ? "text-xl" : "text-2xl"}>
              {order.serviceType === 'daily' && '✨'}
              {order.serviceType === 'deep' && '💧'}
              {order.serviceType === 'moving' && '🚚'}
            </span>
          </div>
          <div>
            <h3 className={cn("font-semibold text-neutral-800", compact ? "text-sm" : "")}>{serviceConfig.name}</h3>
            <p className="text-xs text-neutral-500">订单号：{order.orderNo}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {!compact && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <span className="line-clamp-1">{getFullAddress(order.address)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Clock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <span>{formatDate(order.scheduledTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <User className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <span>
              {order.houseArea}㎡ · {order.customer.name}
            </span>
          </div>
        </div>
      )}

      {compact && (
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{formatDate(order.scheduledTime, 'MM-dd HH:mm')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">{getFullAddress(order.address)}</span>
          </div>
        </div>
      )}

      {order.cleaner && !compact && (
        <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl mb-4">
          <img
            src={order.cleaner.avatar}
            alt={order.cleaner.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <p className="font-medium text-neutral-800">{order.cleaner.name}</p>
            <div className="flex items-center gap-2">
              <RatingBadge rating={order.cleaner.rating} />
              <span className="text-xs text-neutral-500">{order.cleaner.totalOrders}单</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
        <div className={cn("font-bold text-primary-600", compact ? "text-base" : "text-lg")}>¥{order.price}</div>
        {showActions && !compact && (
          <button className="flex items-center gap-1 text-primary-600 font-medium hover:text-primary-700 transition-colors">
            {actionLabel}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {order.review?.isBadReview && !order.review.handled && (
        <div className="mt-4 p-3 bg-danger-50 rounded-xl flex items-center gap-2">
          <span className="text-danger-600 text-sm font-medium">⚠️ 差评待处理</span>
        </div>
      )}
    </div>
  );
};
