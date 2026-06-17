import React from 'react';
import { Check, Clock, MapPin, UserCheck, Camera, CreditCard, MessageSquare } from 'lucide-react';
import type { Order, OrderStatus } from '../../types';
import { formatDate } from '../../utils';

interface OrderTimelineProps {
  order: Order;
  className?: string;
}

const timelineSteps: { status: OrderStatus[]; label: string; icon: React.ElementType }[] = [
  { status: ['pending', 'assigned'], label: '等待接单', icon: Clock },
  { status: ['accepted'], label: '保洁员已接单', icon: UserCheck },
  { status: ['checked_in'], label: '已到达签到', icon: MapPin },
  { status: ['in_progress'], label: '服务进行中', icon: Camera },
  { status: ['completed'], label: '服务已完成', icon: Check },
  { status: ['paid'], label: '已支付', icon: CreditCard },
  { status: ['reviewed'], label: '已评价', icon: MessageSquare },
];

const statusOrder: OrderStatus[] = [
  'pending',
  'assigned',
  'accepted',
  'checked_in',
  'in_progress',
  'completed',
  'paid',
  'reviewed',
  'cancelled',
];

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order, className }) => {
  const currentIndex = statusOrder.indexOf(order.status);

  const getStepStatus = (index: number, stepStatuses: OrderStatus[]) => {
    if (order.status === 'cancelled') return 'cancelled';

    const stepMaxIndex = Math.max(...stepStatuses.map((s) => statusOrder.indexOf(s)));

    if (currentIndex > stepMaxIndex) return 'completed';
    if (stepStatuses.includes(order.status)) return 'current';
    return 'pending';
  };

  return (
    <div className={`space-y-0 ${className}`}>
      {timelineSteps.map((step, index) => {
        const Icon = step.icon;
        const stepStatus = getStepStatus(index, step.status);

        if (order.status === 'cancelled' && index > 0) return null;

        return (
          <div key={index} className="relative pl-8 pb-6 last:pb-0">
            {index < timelineSteps.length - 1 && (
              <div
                className={`absolute left-4 top-6 bottom-0 w-0.5 ${
                  stepStatus === 'completed' ? 'bg-primary-400' : 'bg-neutral-200'
                }`}
              />
            )}

            <div
              className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                stepStatus === 'completed'
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : stepStatus === 'current'
                  ? 'bg-white border-primary-500 text-primary-500 ring-4 ring-primary-100'
                  : stepStatus === 'cancelled'
                  ? 'bg-danger-500 border-danger-500 text-white'
                  : 'bg-white border-neutral-300 text-neutral-400'
              }`}
            >
              {stepStatus === 'completed' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>

            <div className="pt-0.5">
              <p
                className={`font-medium ${
                  stepStatus === 'current' || stepStatus === 'completed'
                    ? 'text-neutral-800'
                    : 'text-neutral-400'
                }`}
              >
                {step.label}
              </p>
              {stepStatus === 'current' && order.scheduledTime && (
                <p className="text-sm text-neutral-500 mt-1">
                  预计时间：{formatDate(order.scheduledTime)}
                </p>
              )}
              {stepStatus === 'completed' && index === 2 && order.actualCheckInTime && (
                <p className="text-sm text-neutral-500 mt-1">
                  签到时间：{formatDate(order.actualCheckInTime)}
                </p>
              )}
              {stepStatus === 'completed' && index === 4 && order.actualCompleteTime && (
                <p className="text-sm text-neutral-500 mt-1">
                  完成时间：{formatDate(order.actualCompleteTime)}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {order.status === 'cancelled' && (
        <div className="relative pl-8">
          <div className="absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center bg-danger-500 text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="font-medium text-danger-600">订单已取消</p>
        </div>
      )}
    </div>
  );
};
