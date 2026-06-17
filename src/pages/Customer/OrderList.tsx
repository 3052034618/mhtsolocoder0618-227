import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { OrderCard } from '../../components/ui/OrderCard';
import { ORDER_STATUS_CONFIG } from '../../types';
import { cn } from '../../utils';
import type { OrderStatus } from '../../types';

const statusFilters: { value: OrderStatus | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: '全部', icon: <Filter className="w-4 h-4" /> },
  { value: 'pending', label: '待派单', icon: <Clock className="w-4 h-4" /> },
  { value: 'assigned', label: '已派单', icon: <Clock className="w-4 h-4" /> },
  { value: 'accepted', label: '已接单', icon: <Clock className="w-4 h-4" /> },
  { value: 'in_progress', label: '服务中', icon: <Clock className="w-4 h-4" /> },
  { value: 'completed', label: '待支付', icon: <AlertCircle className="w-4 h-4" /> },
  { value: 'paid', label: '待评价', icon: <AlertCircle className="w-4 h-4" /> },
  { value: 'reviewed', label: '已完成', icon: <CheckCircle className="w-4 h-4" /> },
];

export const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders, fetchOrders, loading } = useOrderStore();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchOrders({ customerId: user.id });
    }
  }, [user?.id]);

  const myOrders = orders.filter((o) => o.customerId === user?.id);

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
    pending: myOrders.filter((o) => o.status === 'pending').length,
    assigned: myOrders.filter((o) => o.status === 'assigned').length,
    accepted: myOrders.filter((o) => o.status === 'accepted').length,
    in_progress: myOrders.filter((o) => o.status === 'in_progress').length,
    completed: myOrders.filter((o) => o.status === 'completed').length,
    paid: myOrders.filter((o) => o.status === 'paid').length,
    reviewed: myOrders.filter((o) => o.status === 'reviewed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索订单号或地址..."
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
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2',
                statusFilter === filter.value
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              {filter.icon}
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
            <OrderCard
              key={order.id}
              order={order}
              role="customer"
              onAction={() => navigate(`/customer/orders/${order.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">暂无订单</h3>
          <p className="text-neutral-500 mb-6">没有找到符合条件的订单</p>
          <button onClick={() => navigate('/customer/order')} className="btn-primary">
            立即预约服务
          </button>
        </div>
      )}
    </div>
  );
};
