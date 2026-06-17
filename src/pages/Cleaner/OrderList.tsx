import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, MapPin, Star, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { OrderCard } from '../../components/ui/OrderCard';
import { cn } from '../../utils';
import type { OrderStatus } from '../../types';

const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'assigned', label: '待接单' },
  { value: 'accepted', label: '待服务' },
  { value: 'checked_in', label: '已签到' },
  { value: 'in_progress', label: '服务中' },
  { value: 'completed', label: '待支付' },
  { value: 'paid', label: '待评价' },
  { value: 'reviewed', label: '已完成' },
];

export const CleanerOrderList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders, fetchOrders, acceptOrder, loading } = useOrderStore();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchOrders({ cleanerId: user.id });
    }
  }, [user?.id]);

  const myOrders = orders.filter((o) => o.cleanerId === user?.id);

  const filteredOrders = myOrders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address.detail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const orderCounts = {
    all: myOrders.length,
    assigned: myOrders.filter((o) => o.status === 'assigned').length,
    accepted: myOrders.filter((o) => o.status === 'accepted').length,
    checked_in: myOrders.filter((o) => o.status === 'checked_in').length,
    in_progress: myOrders.filter((o) => o.status === 'in_progress').length,
    completed: myOrders.filter((o) => o.status === 'completed').length,
    paid: myOrders.filter((o) => o.status === 'paid').length,
    reviewed: myOrders.filter((o) => o.status === 'reviewed').length,
  };

  const handleAccept = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    try {
      await acceptOrder(orderId);
    } catch (error) {
      console.error('Accept order failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索订单号、地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2',
                statusFilter === filter.value
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              {filter.label}
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  statusFilter === filter.value
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-100 text-neutral-500'
                )}
              >
                {orderCounts[filter.value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="relative">
              {order.status === 'assigned' && (
                <button
                  onClick={(e) => handleAccept(e, order.id)}
                  disabled={loading}
                  className="absolute -top-2 -right-2 z-10 px-3 py-1 bg-accent-500 hover:bg-accent-600 text-white text-xs font-bold rounded-full shadow-lg transition-colors animate-pulse"
                >
                  {loading ? '...' : '点击接单'}
                </button>
              )}
              <OrderCard
                order={order}
                onAction={() => navigate(`/cleaner/order/${order.id}`)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Filter className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">暂无订单</h3>
          <p className="text-neutral-500">没有找到符合条件的订单</p>
        </div>
      )}
    </div>
  );
};
