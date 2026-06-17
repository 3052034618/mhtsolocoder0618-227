import React, { useEffect, useMemo } from 'react';
import {
  User,
  Star,
  Calendar,
  Trophy,
  TrendingUp,
  Wallet,
  Award,
  Clock,
  CheckCircle,
  ChevronRight,
  Phone,
  MapPin,
  FileText,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { StarRating } from '../../components/ui/StarRating';
import { SERVICE_CONFIG } from '../../types';
import type { Cleaner } from '../../types';
import { formatDate, calculateCommission } from '../../utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export const CleanerProfile: React.FC = () => {
  const { user } = useAuthStore();
  const cleaner = user as Cleaner | null;
  const { orders, fetchOrders } = useOrderStore();

  useEffect(() => {
    if (user) {
      fetchOrders({ cleanerId: user.id });
    }
  }, [user?.id]);

  const myOrders = orders.filter((o) => o.cleanerId === user?.id && o.status !== 'cancelled');
  const completedOrders = myOrders.filter((o) => o.status === 'reviewed');
  const reviewedOrders = myOrders.filter((o) => o.review);

  const monthlyStats = useMemo(() => {
    const stats: { [key: string]: { orders: number; rating: number; earnings: number } } = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      stats[key] = { orders: 0, rating: 0, earnings: 0 };
    }

    completedOrders.forEach((order) => {
      const orderDate = new Date(order.scheduledTime);
      const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      if (stats[key]) {
        stats[key].orders++;
        const rating = cleaner?.rating || 5;
        const isBadReview = order.review ? order.review.rating < 3 : false;
        stats[key].earnings += calculateCommission(order.price, rating, isBadReview).total;
        if (order.review) {
          stats[key].rating += order.review.rating;
        }
      }
    });

    return Object.entries(stats).map(([month, data]) => ({
      month: month.split('-')[1] + '月',
      订单数: data.orders,
      收入: data.earnings,
      评分: data.orders > 0 ? (data.rating / data.orders).toFixed(1) : '0',
    }));
  }, [completedOrders]);

  const averageRating =
    reviewedOrders.length > 0
      ? (
          reviewedOrders.reduce((sum, o) => sum + o.review!.rating, 0) / reviewedOrders.length
        ).toFixed(1)
      : cleaner?.rating || '5.0';

  const totalEarnings = completedOrders.reduce((sum, o) => {
    const rating = cleaner?.rating || 5;
    const isBadReview = o.review ? o.review.rating < 3 : false;
    return sum + calculateCommission(o.price, rating, isBadReview).total;
  }, 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthOrders = completedOrders.filter((o) =>
    o.scheduledTime.startsWith(thisMonth)
  );
  const thisMonthEarnings = thisMonthOrders.reduce((sum, o) => {
    const rating = cleaner?.rating || 5;
    const isBadReview = o.review ? o.review.rating < 3 : false;
    return sum + calculateCommission(o.price, rating, isBadReview).total;
  }, 0);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviewedOrders.forEach((o) => {
      if (o.review) {
        dist[o.review.rating - 1]++;
      }
    });
    return [5, 4, 3, 2, 1].map((star, i) => ({
      star: `${star}星`,
      count: dist[4 - i],
      percentage: reviewedOrders.length > 0 ? (dist[4 - i] / reviewedOrders.length) * 100 : 0,
    }));
  }, [reviewedOrders]);

  const skillStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    completedOrders.forEach((order) => {
      const type = SERVICE_CONFIG[order.serviceType].name;
      stats[type] = (stats[type] || 0) + 1;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [completedOrders]);

  const recentReviews = reviewedOrders.slice(0, 5);

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="card bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden ring-4 ring-white/30">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center ring-4 ring-white">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">{user.name}</h2>
            <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-accent-400 fill-accent-400" />
                  <span className="text-xl font-bold">{averageRating}</span>
                </div>
                <span className="text-primary-200">|</span>
                <span className="text-primary-100">累计接单 {cleaner?.totalOrders} 单</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {cleaner?.skills?.map((skill: string) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
          </div>
          <div className="text-right">
            <p className="text-primary-100 mb-1">本月收入</p>
            <p className="text-3xl font-bold">¥{thisMonthEarnings}</p>
            <p className="text-primary-200 text-sm mt-1">{thisMonthOrders.length} 单</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-7 h-7 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-neutral-800">{completedOrders.length}</p>
          <p className="text-sm text-neutral-500">累计完成</p>
        </div>
        <div className="card text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-100 flex items-center justify-center mx-auto mb-3">
            <Star className="w-7 h-7 text-accent-600" />
          </div>
          <p className="text-3xl font-bold text-neutral-800">{averageRating}</p>
          <p className="text-sm text-neutral-500">平均评分</p>
        </div>
        <div className="card text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-7 h-7 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-neutral-800">¥{totalEarnings}</p>
          <p className="text-sm text-neutral-500">累计收入</p>
        </div>
        <div className="card text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <Award className="w-7 h-7 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-neutral-800">{cleaner?.serviceYears}</p>
          <p className="text-sm text-neutral-500">服务年限</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            近6个月数据趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#999" fontSize={12} />
                <YAxis yAxisId="left" stroke="#999" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#999" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar yAxisId="left" dataKey="订单数" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="收入" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent-500" />
            评分分布
          </h3>
          <div className="space-y-3">
            {ratingDistribution.map((item) => (
              <div key={item.star} className="flex items-center gap-3">
                <span className="text-sm text-neutral-600 w-8">{item.star}</span>
                <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-neutral-500 w-8 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-600">好评率</span>
              <span className="text-2xl font-bold text-green-600">
                {reviewedOrders.length > 0
                  ? (
                      ((ratingDistribution[0].count + ratingDistribution[1].count) /
                        reviewedOrders.length) *
                      100
                    ).toFixed(1)
                  : 100}
                %
              </span>
            </div>
            <p className="text-sm text-neutral-500">4星及以上为好评</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            基本信息
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-500 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                联系电话
              </span>
              <span className="font-medium text-neutral-800">{user.phone}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                入职时间
              </span>
              <span className="font-medium text-neutral-800">
                {formatDate(user.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-500 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                服务区域
              </span>
              <span className="font-medium text-neutral-800">{cleaner?.serviceArea}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-neutral-500 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                工作状态
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                {cleaner?.status === 'available' ? '在岗' : '休息中'}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            近期评价
          </h3>
          {recentReviews.length > 0 ? (
            <div className="space-y-4">
              {recentReviews.map((order) => (
                <div key={order.id} className="p-4 bg-neutral-50 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-800">
                          {SERVICE_CONFIG[order.serviceType].name}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {formatDate(order.review!.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StarRating value={order.review!.rating} readOnly size="sm" />
                  </div>
                  <p className="text-neutral-600">{order.review!.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">暂无评价</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
