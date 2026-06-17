import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle,
  Star,
  TrendingUp,
  Clock,
  MapPin,
  Phone,
  User,
  ChevronRight,
  Bell,
  Wallet,
  Calendar,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { StatCard } from '../../components/ui/StatCard';
import { OrderCard } from '../../components/ui/OrderCard';
import { SERVICE_CONFIG } from '../../types';
import type { Cleaner } from '../../types';
import { formatDate, cn } from '../../utils';

export const CleanerHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const cleaner = user as Cleaner | null;
  const { orders, fetchOrders, acceptOrder, loading } = useOrderStore();
  const [showNotification, setShowNotification] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders({ cleanerId: user.id });
    }
  }, [user?.id]);

  const myOrders = orders.filter((o) => o.cleanerId === user?.id);
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = myOrders.filter((o) => o.scheduledTime.startsWith(today));
  const assignedOrders = myOrders.filter((o) => o.status === 'assigned');
  const inProgressOrders = myOrders.filter((o) =>
    ['accepted', 'checked_in', 'in_progress'].includes(o.status)
  );
  const completedThisMonth = myOrders.filter((o) => {
    const orderMonth = new Date(o.scheduledTime).getMonth();
    const orderYear = new Date(o.scheduledTime).getFullYear();
    const now = new Date();
    return (
      o.status === 'reviewed' &&
      orderMonth === now.getMonth() &&
      orderYear === now.getFullYear()
    );
  });

  const averageRating =
    completedThisMonth.length > 0
      ? (
          completedThisMonth.reduce((sum, o) => sum + (o.review?.rating || 0), 0) /
          completedThisMonth.length
        ).toFixed(1)
      : cleaner?.rating || '5.0';

  const totalEarnings = completedThisMonth.reduce(
    (sum, o) => sum + Math.floor(o.price * 0.6),
    0
  );

  const handleAccept = async (orderId: string) => {
    try {
      await acceptOrder(orderId);
    } catch (error) {
      console.error('Accept order failed:', error);
    }
  };

  return (
    <div className="space-y-8">
      {showNotification && assignedOrders.length > 0 && (
        <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute right-8 bottom-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mb-12" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">您有 {assignedOrders.length} 个新派单</h3>
                  <p className="text-accent-100">请及时确认接单</p>
                </div>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {assignedOrders.slice(0, 2).map((order) => (
                <div
                  key={order.id}
                  className="bg-white/10 rounded-xl p-3 flex items-center justify-between backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{SERVICE_CONFIG[order.serviceType].name}</p>
                      <p className="text-sm text-accent-100">
                        {formatDate(order.scheduledTime)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAccept(order.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-white text-accent-600 font-medium rounded-lg hover:bg-accent-50 transition-colors text-sm"
                  >
                    {loading ? '...' : '接单'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="今日订单"
          value={todayOrders.length}
          icon={<Calendar className="w-6 h-6" />}
          color="primary"
        />
        <StatCard
          title="本月完成"
          value={completedThisMonth.length}
          icon={<CheckCircle className="w-6 h-6" />}
          color="accent"
          trend={{ value: 15, isUp: true }}
        />
        <StatCard
          title="平均评分"
          value={averageRating}
          icon={<Star className="w-6 h-6" />}
          color="accent"
        />
        <StatCard
          title="本月收入"
          value={`¥${totalEarnings}`}
          icon={<Wallet className="w-6 h-6" />}
          color="neutral"
          trend={{ value: 20, isUp: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-800">今日服务</h2>
              <button
                onClick={() => navigate('/cleaner/orders')}
                className="text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {todayOrders.length > 0 ? (
              <div className="space-y-4">
                {todayOrders.map((order) => (
                  <div key={order.id} className="relative">
                    {order.status === 'assigned' && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <span className="px-2 py-1 bg-accent-500 text-white text-xs font-bold rounded-full animate-pulse">
                          待接单
                        </span>
                      </div>
                    )}
                    <OrderCard
                      order={order}
                      onAction={() => navigate(`/cleaner/order/${order.id}`)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">今日暂无服务安排</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {inProgressOrders.length > 0 && (
            <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 animate-pulse" />
                <h3 className="text-lg font-bold">进行中的服务</h3>
              </div>
              {inProgressOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/cleaner/order/${order.id}`)}
                  className="bg-white/20 rounded-xl p-4 cursor-pointer hover:bg-white/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {SERVICE_CONFIG[order.serviceType].name}
                    </span>
                    <span className="text-primary-100 text-sm">
                      {formatDate(order.scheduledTime).split(' ')[1]}
                    </span>
                  </div>
                  <p className="text-primary-100 text-sm mb-3 line-clamp-1">
                    {order.address.detail}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">¥{order.price}</span>
                    <span className="text-sm text-primary-100 flex items-center gap-1">
                      查看详情
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-bold text-neutral-800 mb-4">个人信息</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary-600" />
                )}
              </div>
              <div>
                <h4 className="text-xl font-bold text-neutral-800">{user?.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                  <span className="font-medium">{cleaner?.rating}</span>
                  <span className="text-neutral-400">·</span>
                  <span className="text-sm text-neutral-500">{cleaner?.totalOrders}单</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                <span className="text-neutral-500">入职时间</span>
                <span className="font-medium text-neutral-800">
                  {formatDate(user?.createdAt || '')}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                <span className="text-neutral-500">技能标签</span>
                <div className="flex gap-2">
                  {cleaner?.skills?.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-primary-100 text-primary-600 rounded-lg text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-neutral-500">联系电话</span>
                <span className="font-medium text-neutral-800">{user?.phone}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/cleaner/profile')}
              className="w-full mt-4 py-3 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-medium text-neutral-700 transition-colors flex items-center justify-center gap-2"
            >
              查看完整档案
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
