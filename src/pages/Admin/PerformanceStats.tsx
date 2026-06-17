import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Star,
  Users,
  Wallet,
  Award,
  Calendar,
  Filter,
  Download,
  Trophy,
  Target,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useOrderStore } from '../../store/useOrderStore';
import { StatCard } from '../../components/ui/StatCard';
import { SERVICE_CONFIG } from '../../types';
import { formatDate, calculateCommission, cn } from '../../utils';
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'];

export const PerformanceStats: React.FC = () => {
  const { cleaners, fetchCleaners } = useUserStore();
  const { orders, fetchOrders } = useOrderStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchCleaners();
    fetchOrders();
  }, []);

  const monthOrders = useMemo(() => {
    return orders.filter(
      (o) => o.scheduledTime.startsWith(selectedMonth) && o.status !== 'cancelled'
    );
  }, [orders, selectedMonth]);

  const completedOrders = monthOrders.filter((o) => o.status === 'reviewed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.price, 0);
  const totalCommission = completedOrders.reduce((sum, o) => sum + calculateCommission(o.price, o.review?.rating || 5, o.review?.isBadReview || false).total, 0);

  const avgRating = useMemo(() => {
    const reviewed = completedOrders.filter((o) => o.review);
    if (reviewed.length === 0) return '5.0';
    return (
      reviewed.reduce((sum, o) => sum + (o.review?.rating || 0), 0) / reviewed.length
    ).toFixed(1);
  }, [completedOrders]);

  const monthlyTrend = useMemo(() => {
    const data: { month: string; 订单数: number; 收入: number; 评分: string }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthData = orders.filter(
        (o) => o.scheduledTime.startsWith(key) && o.status === 'reviewed'
      );
      const reviewed = monthData.filter((o) => o.review);
      const avg =
        reviewed.length > 0
          ? (reviewed.reduce((sum, o) => sum + (o.review?.rating || 0), 0) / reviewed.length).toFixed(1)
          : '0';

      data.push({
        month: `${date.getMonth() + 1}月`,
        订单数: monthData.length,
        收入: monthData.reduce((sum, o) => sum + o.price, 0),
        评分: avg,
      });
    }

    return data;
  }, [orders]);

  const cleanerRanking = useMemo(() => {
    return cleaners
      .map((cleaner) => {
        const cleanerOrders = monthOrders.filter(
          (o) => o.cleanerId === cleaner.id && o.status === 'reviewed'
        );
        const reviewed = cleanerOrders.filter((o) => o.review);
        const avgRating =
          reviewed.length > 0
            ? reviewed.reduce((sum, o) => sum + (o.review?.rating || 0), 0) / reviewed.length
            : 0;
        const earnings = cleanerOrders.reduce((sum, o) => sum + calculateCommission(o.price, o.review?.rating || 5, o.review?.isBadReview || false).total, 0);

        return {
          ...cleaner,
          orderCount: cleanerOrders.length,
          avgRating: avgRating.toFixed(1),
          earnings,
        };
      })
      .sort((a, b) => b.orderCount - a.orderCount);
  }, [cleaners, monthOrders]);

  const serviceDistribution = useMemo(() => {
    const stats: { [key: string]: number } = {};
    completedOrders.forEach((order) => {
      const type = SERVICE_CONFIG[order.serviceType].name;
      stats[type] = (stats[type] || 0) + 1;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [completedOrders]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    completedOrders.forEach((order) => {
      if (order.review) {
        dist[order.review.rating - 1]++;
      }
    });
    return [5, 4, 3, 2, 1].map((star, i) => ({
      star: `${star}星`,
      count: dist[4 - i],
    }));
  }, [completedOrders]);

  const topPerformers = cleanerRanking.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">绩效统计</h2>
          <p className="text-neutral-500">查看月度绩效数据和保洁员排名</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-field w-auto"
          />
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-5 h-5" />
            导出报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="总订单数"
          value={monthOrders.length}
          icon={<BarChart3 className="w-6 h-6" />}
          color="primary"
          trend={{ value: 12, isUp: true }}
        />
        <StatCard
          title="完成订单"
          value={completedOrders.length}
          icon={<Target className="w-6 h-6" />}
          color="accent"
          trend={{ value: 8, isUp: true }}
        />
        <StatCard
          title="营业收入"
          value={`¥${totalRevenue}`}
          icon={<Wallet className="w-6 h-6" />}
          color="neutral"
          trend={{ value: 15, isUp: true }}
        />
        <StatCard
          title="支出佣金"
          value={`¥${totalCommission}`}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="平均评分"
          value={avgRating}
          icon={<Star className="w-6 h-6" />}
          color="accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            近6个月趋势
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
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
                <Legend />
                <Bar yAxisId="left" dataKey="订单数" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="收入" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent-500" />
            服务类型分布
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary-500" />
          本月排行榜
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {topPerformers.map((cleaner, index) => (
            <div
              key={cleaner.id}
              className={cn(
                'relative p-6 rounded-2xl text-center',
                index === 0
                  ? 'bg-gradient-to-br from-accent-50 to-accent-100 border-2 border-accent-200'
                  : index === 1
                  ? 'bg-gradient-to-br from-neutral-50 to-neutral-100 border-2 border-neutral-200'
                  : 'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200'
              )}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-white',
                    index === 0
                      ? 'bg-accent-500'
                      : index === 1
                      ? 'bg-neutral-500'
                      : 'bg-amber-600'
                  )}
                >
                  {index + 1}
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-3 overflow-hidden ring-4 ring-white/50">
                {cleaner.avatar ? (
                  <img
                    src={cleaner.avatar}
                    alt={cleaner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-8 h-8 text-neutral-400" />
                )}
              </div>
              <h4 className="text-lg font-bold text-neutral-800 mb-1">{cleaner.name}</h4>
              <div className="flex items-center justify-center gap-2 mb-3">
                <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                <span className="font-medium">{cleaner.avgRating}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500">接单量</p>
                  <p className="text-xl font-bold text-primary-600">{cleaner.orderCount}</p>
                </div>
                <div>
                  <p className="text-neutral-500">佣金</p>
                  <p className="text-xl font-bold text-accent-600">¥{cleaner.earnings}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                  排名
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                  保洁员
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                  接单量
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                  平均评分
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                  佣金收入
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                  完成率
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {cleanerRanking.map((cleaner, index) => {
                const allOrders = monthOrders.filter((o) => o.cleanerId === cleaner.id);
                const completionRate =
                  allOrders.length > 0
                    ? ((cleaner.orderCount / allOrders.length) * 100).toFixed(1)
                    : '0';

                return (
                  <tr
                    key={cleaner.id}
                    className="border-b border-neutral-100 hover:bg-neutral-50"
                  >
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                          index === 0
                            ? 'bg-accent-100 text-accent-600'
                            : index === 1
                            ? 'bg-neutral-100 text-neutral-600'
                            : index === 2
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-neutral-50 text-neutral-500'
                        )}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
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
                        <div>
                          <p className="font-medium text-neutral-800">{cleaner.name}</p>
                          <p className="text-sm text-neutral-500">{cleaner.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-lg font-bold text-neutral-800">
                        {cleaner.orderCount}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                        <span className="font-medium">{cleaner.avgRating}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-lg font-bold text-primary-600">
                        ¥{cleaner.earnings}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-neutral-600">
                          {completionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                        查看详情
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent-500" />
            评分分布
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#999" fontSize={12} />
                <YAxis dataKey="star" type="category" stroke="#999" fontSize={12} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <h3 className="text-lg font-bold text-primary-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            需要关注
          </h3>
          <div className="space-y-3">
            {cleanerRanking
              .filter((c) => parseFloat(c.avgRating) < 4.5 && c.orderCount > 0)
              .slice(0, 5)
              .map((cleaner) => (
                <div
                  key={cleaner.id}
                  className="flex items-center justify-between p-3 bg-white rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center overflow-hidden">
                      {cleaner.avatar ? (
                        <img
                          src={cleaner.avatar}
                          alt={cleaner.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-danger-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">{cleaner.name}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-3 h-3 text-accent-500 fill-accent-500" />
                        <span className="text-accent-600 font-medium">{cleaner.avgRating}</span>
                        <span className="text-neutral-400">·</span>
                        <span className="text-neutral-500">{cleaner.orderCount}单</span>
                      </div>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-primary-100 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-200 transition-colors">
                    关注
                  </button>
                </div>
              ))}
            {cleanerRanking.filter((c) => parseFloat(c.avgRating) < 4.5 && c.orderCount > 0).length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-neutral-500">所有保洁员评分都很棒！</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
