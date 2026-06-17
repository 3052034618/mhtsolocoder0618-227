import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, User, MapPin, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { useUserStore } from '../../store/useUserStore';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ORDER_STATUS_CONFIG, SERVICE_CONFIG } from '../../types';
import { formatDate, cn } from '../../utils';
import type { Order, OrderStatus } from '../../types';

const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待派单' },
  { value: 'assigned', label: '已派单' },
  { value: 'accepted', label: '已接单' },
  { value: 'checked_in', label: '已签到' },
  { value: 'in_progress', label: '服务中' },
  { value: 'completed', label: '待支付' },
  { value: 'paid', label: '待评价' },
  { value: 'reviewed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export const OrderManagement: React.FC = () => {
  const navigate = useNavigate();
  const { orders, fetchOrders, loading } = useOrderStore();
  const { cleaners, customers, fetchCleaners, fetchCustomers } = useUserStore();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchCleaners();
    fetchCustomers();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address.detail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate =
      dateFilter === '' || order.scheduledTime.startsWith(dateFilter);
    return matchesStatus && matchesSearch && matchesDate;
  });

  const getCustomer = (customerId: string) =>
    customers.find((c) => c.id === customerId);

  const getCleaner = (cleanerId?: string) =>
    cleanerId ? cleaners.find((c) => c.id === cleanerId) : undefined;

  const OrderRow: React.FC<{ order: Order }> = ({ order }) => {
    const customer = getCustomer(order.customerId);
    const cleaner = getCleaner(order.cleanerId);

    return (
      <tr
        onClick={() => navigate(`/dispatcher/order/${order.id}`)}
        className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors"
      >
        <td className="py-4 px-4">
          <div>
            <p className="font-medium text-neutral-800">{order.orderNo}</p>
            <p className="text-sm text-neutral-500">
              {SERVICE_CONFIG[order.serviceType].name}
            </p>
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
              {customer?.avatar ? (
                <img src={customer.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-primary-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-neutral-800">{customer?.name}</p>
              <p className="text-sm text-neutral-500">{customer?.phone}</p>
            </div>
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2 text-neutral-600">
            <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <span className="text-sm max-w-[200px] truncate">
              {order.address.detail}
            </span>
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2">
            {cleaner ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center overflow-hidden">
                  {cleaner.avatar ? (
                    <img src={cleaner.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-accent-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-neutral-800 text-sm">
                    {cleaner.name}
                  </p>
                  <p className="text-xs text-neutral-500">{cleaner.phone}</p>
                </div>
              </div>
            ) : (
              <span className="text-sm text-neutral-400">未分配</span>
            )}
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="text-sm">
            <p className="text-neutral-800 font-medium">{formatDate(order.scheduledTime)}</p>
            <p className="text-neutral-500">{order.houseArea}㎡ · ¥{order.price}</p>
          </div>
        </td>
        <td className="py-4 px-4">
          <StatusBadge status={order.status} />
        </td>
        <td className="py-4 px-4">
          {order.review && (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'w-3 h-3 rounded-full',
                    i < order.review!.rating ? 'bg-accent-500' : 'bg-neutral-200'
                  )}
                />
              ))}
            </div>
          )}
        </td>
      </tr>
    );
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
        <input
          type="date"
          className="input-field w-full md:w-auto"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-card p-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                statusFilter === filter.value
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                    订单信息
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                    客户
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                    地址
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                    保洁员
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                    时间/费用
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                    状态
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                    评价
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Filter className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">没有找到符合条件的订单</p>
          </div>
        )}
      </div>
    </div>
  );
};
