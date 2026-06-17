import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Users,
  Clock,
  AlertTriangle,
  MapPin,
  TrendingUp,
  CheckCircle,
  Star,
  Sparkles,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { useUserStore } from '../../store/useUserStore';
import { StatCard } from '../../components/ui/StatCard';
import { OrderCard } from '../../components/ui/OrderCard';
import { CleanerCard } from '../../components/ui/CleanerCard';
import { recommendCleaners, cn } from '../../utils';
import type { Order } from '../../types';

export const DispatcherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { orders, fetchOrders, assignOrder, loading } = useOrderStore();
  const { cleaners, fetchCleaners } = useUserStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [recommendedCleaners, setRecommendedCleaners] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchCleaners();
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const todayOrders = orders.filter((o) => {
    const today = new Date().toISOString().slice(0, 10);
    return o.scheduledTime.startsWith(today);
  });
  const onGoingOrders = orders.filter((o) =>
    ['assigned', 'accepted', 'checked_in', 'in_progress'].includes(o.status)
  );
  const badReviews = orders.filter(
    (o) => o.review && o.review.rating <= 2 && !o.review.handled
  );

  const availableCleaners = cleaners.filter((c) => c.status === 'available');

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    const recommended = recommendCleaners(
      cleaners,
      order.address,
      order.serviceType
    );
    setRecommendedCleaners(recommended);
  };

  const handleAssign = async (cleanerId: string) => {
    if (!selectedOrder) return;
    try {
      await assignOrder({ orderId: selectedOrder.id, cleanerId });
      setSelectedOrder(null);
      setRecommendedCleaners([]);
    } catch (error) {
      console.error('Assign order failed:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="待派单"
          value={pendingOrders.length}
          icon={<ClipboardList className="w-6 h-6" />}
          color="danger"
          trend={{ value: 12, isUp: true }}
        />
        <StatCard
          title="今日订单"
          value={todayOrders.length}
          icon={<CalendarIcon className="w-6 h-6" />}
          color="primary"
          trend={{ value: 8, isUp: true }}
        />
        <StatCard
          title="进行中"
          value={onGoingOrders.length}
          icon={<Clock className="w-6 h-6" />}
          color="accent"
        />
        <StatCard
          title="待处理差评"
          value={badReviews.length}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-800">待派单订单</h2>
              <button
                onClick={() => navigate('/dispatcher/orders')}
                className="text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {pendingOrders.length > 0 ? (
              <div className="space-y-4">
                {pendingOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={cn(
                      'p-4 border-2 rounded-xl cursor-pointer transition-all',
                      selectedOrder?.id === order.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-100 hover:border-primary-200'
                    )}
                  >
                    <OrderCard order={order} compact />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-primary-400 mx-auto mb-3" />
                <p className="text-neutral-500">所有订单已派单完成</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-neutral-800 mb-4">在岗保洁员</h2>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-neutral-500">
                {availableCleaners.length} 人在岗
              </span>
            </div>
            <div className="space-y-3">
              {availableCleaners.slice(0, 4).map((cleaner) => (
                <div
                  key={cleaner.id}
                  className="p-3 bg-neutral-50 rounded-xl flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                    {cleaner.avatar ? (
                      <img
                        src={cleaner.avatar}
                        alt={cleaner.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 truncate">
                      {cleaner.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-3 h-3 text-accent-500 fill-accent-500" />
                      <span className="text-neutral-600">{cleaner.rating}</span>
                      <span className="text-neutral-300">·</span>
                      <span className="text-green-600">{cleaner.skills[0]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/dispatcher/schedule')}
              className="w-full mt-4 py-2 text-primary-600 font-medium hover:bg-primary-50 rounded-xl transition-colors"
            >
              查看排班看板
            </button>
          </div>

          {badReviews.length > 0 && (
            <div className="card bg-gradient-to-br from-danger-50 to-danger-100 border-danger-200">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-danger-600" />
                <h2 className="text-lg font-bold text-danger-800">待处理差评</h2>
                <span className="px-2 py-0.5 bg-danger-500 text-white text-xs rounded-full">
                  {badReviews.length}
                </span>
              </div>
              <div className="space-y-2">
                {badReviews.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    onClick={() => navigate('/dispatcher/reviews')}
                    className="p-3 bg-white rounded-xl cursor-pointer hover:bg-danger-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-neutral-800">
                        {order.orderNo}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-accent-500 fill-accent-500" />
                        <span className="text-sm font-medium text-accent-600">
                          {order.review?.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-500 line-clamp-1">
                      {order.review?.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && recommendedCleaners.length > 0 && (
        <div className="card animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-accent-500" />
            <h2 className="text-xl font-bold text-neutral-800">智能推荐保洁员</h2>
            <span className="text-sm text-neutral-500">
              为订单 {selectedOrder.orderNo} 推荐
            </span>
          </div>

          <p className="text-sm text-neutral-500 mb-4">
            系统根据距离（40%）、评分（35%）、技能（25%）综合计算匹配度，优先推荐高匹配度保洁员
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedCleaners.map((item) => (
              <div key={item.cleaner.id} className="relative">
                {item.matchScore >= 80 && (
                  <div className="absolute -top-2 -right-2 z-10 px-3 py-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    最佳匹配
                  </div>
                )}
                <CleanerCard
                  cleaner={item.cleaner}
                  matchScore={item.matchScore}
                  distance={item.distance}
                />
                <button
                  onClick={() => handleAssign(item.cleaner.id)}
                  disabled={loading}
                  className={cn(
                    'w-full mt-3 py-2.5 rounded-xl font-medium transition-all',
                    item.matchScore >= 80
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700'
                      : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                  )}
                >
                  {loading ? '派单中...' : '立即派单'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
