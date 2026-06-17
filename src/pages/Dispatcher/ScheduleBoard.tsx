import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Droplets,
  Truck,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { useUserStore } from '../../store/useUserStore';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SERVICE_CONFIG } from '../../types';
import { formatDate, cn } from '../../utils';
import { addDays, startOfWeek, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Order, ServiceType } from '../../types';

const ServiceIcon: React.FC<{ type: ServiceType; className?: string }> = ({ type, className }) => {
  if (type === 'daily') return <Sparkles className={className} />;
  if (type === 'deep') return <Droplets className={className} />;
  return <Truck className={className} />;
};

export const ScheduleBoard: React.FC = () => {
  const navigate = useNavigate();
  const { orders, fetchOrders } = useOrderStore();
  const { cleaners, fetchCleaners } = useUserStore();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedCleaner, setSelectedCleaner] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchCleaners();
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const pendingOrders = orders.filter(
    (o) => o.status === 'pending'
  );

  const getCleanerOrdersForDate = (cleanerId: string, date: Date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return orders.filter(
      (o) =>
        o.cleanerId === cleanerId &&
        o.scheduledTime.startsWith(dateStr) &&
        o.status !== 'cancelled'
    );
  };

  const getTimeSlot = (timeStr: string) => {
    const hour = parseInt(timeStr.split('T')[1].split(':')[0]);
    if (hour < 10) return 'morning';
    if (hour < 14) return 'noon';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'border-blue-400 bg-blue-50';
      case 'accepted':
        return 'border-accent-400 bg-accent-50';
      case 'checked_in':
        return 'border-purple-400 bg-purple-50';
      case 'in_progress':
        return 'border-primary-400 bg-primary-50';
      case 'completed':
        return 'border-green-400 bg-green-50';
      case 'paid':
      case 'reviewed':
        return 'border-gray-300 bg-gray-50';
      default:
        return 'border-neutral-200 bg-white';
    }
  };

  const displayedCleaners = selectedCleaner
    ? cleaners.filter((c) => c.id === selectedCleaner)
    : cleaners;

  const getPendingDateOrders = (date: Date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return pendingOrders.filter((o) => o.scheduledTime.startsWith(dateStr));
  };

  const goToDispatch = (orderId?: string) => {
    navigate('/dispatcher');
    if (orderId) {
      setTimeout(() => {
        const el = document.getElementById(`order-${orderId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">排班看板</h2>
          <p className="text-neutral-500">查看和管理保洁员的每日排班</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input-field w-auto"
            value={selectedCleaner || ''}
            onChange={(e) => setSelectedCleaner(e.target.value || null)}
          >
            <option value="">全部保洁员</option>
            {cleaners.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pendingOrders.length > 0 && (
        <div className="card border-2 border-dashed border-accent-300 bg-accent-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-800">待派单订单</h3>
                <p className="text-sm text-neutral-500">
                  共 {pendingOrders.length} 条订单等待分配保洁员
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dispatcher')}
              className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              去派单
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingOrders.slice(0, 6).map((order) => (
              <div
                key={order.id}
                id={`pending-${order.id}`}
                onClick={() => goToDispatch(order.id)}
                className="p-3 bg-white rounded-xl border border-accent-200 cursor-pointer hover:border-accent-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <ServiceIcon
                      type={order.serviceType}
                      className="w-5 h-5 text-primary-600"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-neutral-800 text-sm">
                        {SERVICE_CONFIG[order.serviceType].name}
                      </span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(order.scheduledTime, 'MM-dd HH:mm')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-neutral-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{order.address.detail}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-neutral-400">
                        {order.houseArea}㎡ · {order.customer.name}
                      </span>
                      <span className="text-primary-600 font-bold text-sm">
                        ¥{order.price}
                      </span>
                    </div>
                    {order.recurringServiceId && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">
                          <RefreshCw className="w-3 h-3" />
                          定期服务
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pendingOrders.length > 6 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => navigate('/dispatcher')}
                className="text-accent-600 text-sm font-medium hover:text-accent-700"
              >
                查看全部 {pendingOrders.length} 条待派单 →
              </button>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={prevWeek}
              className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <h3 className="text-lg font-bold text-neutral-800">
              {format(currentWeekStart, 'yyyy年MM月dd日', { locale: zhCN })} -{' '}
              {format(addDays(currentWeekStart, 6), 'MM月dd日', { locale: zhCN })}
            </h3>
            <button
              onClick={nextWeek}
              className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-primary-100 text-primary-600 font-medium rounded-xl hover:bg-primary-200 transition-colors"
          >
            今天
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-neutral-100">
                <th className="sticky left-0 bg-white z-10 p-4 text-left w-40">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-400" />
                    <span className="font-semibold text-neutral-600">保洁员</span>
                  </div>
                </th>
                {weekDays.map((day) => {
                  const isToday =
                    day.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
                  const dayName = format(day, 'EEE', { locale: zhCN });
                  const pendingCount = getPendingDateOrders(day).length;
                  return (
                    <th
                      key={day.toISOString()}
                      className={cn(
                        'p-4 text-center min-w-[120px]',
                        isToday && 'bg-primary-50'
                      )}
                    >
                      <div
                        className={cn(
                          'text-sm font-medium',
                          isToday ? 'text-primary-600' : 'text-neutral-600'
                        )}
                      >
                        {dayName}
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            isToday && 'bg-primary-500 text-white font-bold'
                          )}
                        >
                          {format(day, 'd')}
                        </div>
                        {pendingCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-accent-500 text-white text-xs flex items-center justify-center">
                            {pendingCount}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-dashed border-accent-200 bg-accent-50/30">
                <td className="sticky left-0 bg-accent-50/30 z-10 p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-accent-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800 text-sm">待派单</p>
                      <p className="text-xs text-neutral-500">未分配保洁员</p>
                    </div>
                  </div>
                </td>
                {weekDays.map((day) => {
                  const dayPending = getPendingDateOrders(day);
                  const isToday =
                    day.toISOString().slice(0, 10) ===
                    new Date().toISOString().slice(0, 10);

                  return (
                    <td
                      key={day.toISOString()}
                      className={cn('p-2 align-top', isToday && 'bg-primary-50/30')}
                    >
                      <div className="space-y-2">
                        {dayPending.length > 0 ? (
                          dayPending.map((order) => (
                            <div
                              key={order.id}
                              onClick={() => goToDispatch(order.id)}
                              className="p-2 rounded-lg border-2 border-dashed border-accent-300 bg-accent-50 text-xs cursor-pointer hover:border-accent-500 hover:bg-accent-100 transition-all"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-accent-700">
                                  {formatDate(order.scheduledTime).split(' ')[1]}
                                </span>
                                {order.recurringServiceId && (
                                  <RefreshCw className="w-3 h-3 text-accent-500" />
                                )}
                              </div>
                              <p className="font-medium text-neutral-800 mb-1">
                                {SERVICE_CONFIG[order.serviceType].name}
                              </p>
                              <p className="text-neutral-500 line-clamp-1">
                                {order.address.detail}
                              </p>
                              <p className="text-primary-600 font-medium mt-1">
                                ¥{order.price}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="h-16 flex items-center justify-center">
                            <span className="text-xs text-neutral-300">-</span>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {displayedCleaners.map((cleaner) => (
                <tr key={cleaner.id} className="border-b border-neutral-100">
                  <td className="sticky left-0 bg-white z-10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {cleaner.avatar ? (
                          <img
                            src={cleaner.avatar}
                            alt={cleaner.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-800 truncate">
                          {cleaner.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              cleaner.status === 'available'
                                ? 'bg-green-500'
                                : (cleaner.status as string) === 'on_leave'
                                ? 'bg-amber-500'
                                : (cleaner.status as string) === 'rest'
                                ? 'bg-blue-500'
                                : 'bg-neutral-300'
                            )}
                          />
                          <span className="text-xs text-neutral-500">
                            {cleaner.status === 'available'
                              ? '在岗'
                              : (cleaner.status as string) === 'on_leave'
                              ? '休假'
                              : (cleaner.status as string) === 'rest'
                              ? '休息'
                              : '忙碌'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const dayOrders = getCleanerOrdersForDate(cleaner.id, day);
                    const isToday =
                      day.toISOString().slice(0, 10) ===
                      new Date().toISOString().slice(0, 10);

                    return (
                      <td
                        key={day.toISOString()}
                        className={cn('p-2 align-top', isToday && 'bg-primary-50/50')}
                      >
                        <div className="space-y-2">
                          {dayOrders.length > 0 ? (
                            dayOrders.map((order) => {
                              const timeSlot = getTimeSlot(order.scheduledTime);
                              return (
                                <div
                                  key={order.id}
                                  className={cn(
                                    'p-2 rounded-lg border-2 text-xs',
                                    getStatusColor(order.status)
                                  )}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-neutral-700">
                                      {formatDate(order.scheduledTime).split(' ')[1]}
                                    </span>
                                    <StatusBadge status={order.status} size="sm" />
                                  </div>
                                  <p className="font-medium text-neutral-800 mb-1">
                                    {SERVICE_CONFIG[order.serviceType].name}
                                  </p>
                                  <p className="text-neutral-500 line-clamp-1">
                                    {order.address.detail}
                                  </p>
                                  <p className="text-primary-600 font-medium mt-1">
                                    ¥{order.price}
                                  </p>
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-16 flex items-center justify-center">
                              <span className="text-xs text-neutral-300">无排班</span>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-neutral-600">在岗</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm text-neutral-600">休假</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neutral-300" />
          <span className="text-sm text-neutral-600">休息</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-500" />
          <span className="text-sm text-neutral-600">今日</span>
        </div>
      </div>
    </div>
  );
};
